---
title: Simplying Transaction in Golang with Unit of Work Pattern
tags:
- golang
- database
---

_Unit of Work (or short, `UoW`)_ is a pattern of grouping multiple database operations and executing them as a single atomic operation. An operation is atomic if all the suboperations complete, or none of them do.

## The Problem

In your application, you may want to ensure multiple database operations happen in a single transaction. This could be an insert operation to multiple tables, for example.Transactions are important to ensure data integrity. If the first insert succeeds but the second fails, the first operation should rollback so that none of the inserts happen.

This is where the _Unit of Work_ (`UoW`) pattern shines. The implementation details for managing the transaction lifecycle are abstracted by the _Unit of Work_. This pattern starts a transaction and automatically commits it at the end, or otherwise performs a rollback if an error occurs.

## The Interface

The `UoW` interface is relatively simple:

```go
type unitOfWork interface {
	RunInTx(ctx context.Context, fn func(txCtx context.Context) error) error
}
```

`RunInTx` wraps a function as an atomic operation. The function has access to the transaction instance through context propagation. One interesting property of this implementation is that transactions can __never__ be nested.

Even if `RunInTx` is called multiple times within itself, only one transaction is created. Only that transaction, which we will refer to as the _root transaction_, can commit or rollback the operation. This will be particularly useful in testing, which we will see later.

```go
// RunInTx wraps the operation in a transaction. If a context containing tx is
// passed in, then it will use the context tx. Transaction cannot be nested.
// The transaction can only be committed by the parent.
func (uow *UnitOfWork) RunInTx(ctx context.Context, fn func(context.Context) error, opts ...Option) (err error) {
	if isTxContext(ctx) {
		return fn(ctx)
	}

	if uow.IsTx() {
		return fn(WithValue(ctx, uow))
	}

	tx, err := uow.db.BeginTx(ctx, getUowOptions(opts...).Tx)
	if err != nil {
		return err
	}

	defer func() {
		if p := recover(); p != nil {
			// A panic occur, rollback and repanic.
			err = tx.Rollback()
			panic(p)
		} else if err != nil {
			// Something went wrong, rollback, but keep the original error.
			_ = tx.Rollback()
		} else {
			// Success, commit.
			err = tx.Commit()
		}
	}()

	return fn(WithValue(ctx, newTx(tx)))
}
```

The full implementation can be found at [github.com/alextanhongpin/uow](https://github.com/alextanhongpin/uow).


## Code Example

The source code is available [here](https://github.com/alextanhongpin/go-unit-of-work).

The example below follows a simple _User Device Registration_ use case that inserts data into two separate tables atomically. The _application service layer_ (in this case, the _use case layer_) typically initialises the _Unit of Work_. This layer is usually just one layer above the _repository layer_.

```go
type userRepository interface {
	CreateUser(ctx context.Context, email string) (*User, error)
	CreateUserDevice(ctx context.Context, userID uuid.UUID, deviceID string) (*UserDevice, error)
}

type UserUseCase struct {
	uow  uow.UOW
	repo userRepository
}

func (uc *UserUseCase) Register(ctx context.Context, email, deviceID string) error {
	return uc.uow.RunInTx(ctx, func(ctx context.Context) error {
		// The first operation inserts a new user.
		user, err := uc.repo.CreateUser(ctx, email)
		if err != nil {
			return err
		}

		// The second operation inserts a new user device.
		_, err = uc.repo.CreateUserDevice(ctx, user.ID, deviceID)
		return err
	})
}
```

Our `repository.go`:

```go
type PostgresUserRepository struct {
	uow uow.UOW
}

func (p *PostgresUserRepository) CreateUser(ctx context.Context, email string) (*User, error) {
	// DB extracts the *sql.Tx from the context, or initialize a new *sql.DB.
	db := p.uow.DB(ctx)

	var u User
	err := db.
		QueryRowContext(ctx, createUserStmt, email).
		Scan(&u.ID, &u.Email)
	if err != nil {
		return nil, fmt.Errorf("failed to create user: %w", err)
	}

	return &u, nil
}
```

## Transaction in Integration Tests

When running unit tests, it is often faster to rollback the transaction than to truncate tables or recreate the database. We can take advantage of the fact that the `uow` library ensures that transactions can not be nested. We return a _sentinel error_, `ErrRollback` at the end of `RunInTx` to ensure the operations are not committed.

```go
var ErrRollback = errors.New("test: rollback")

func TestUserUseCase(t *testing.T) {
	// Arrange.
	u := uow.New(db)
	repo := app.NewPostgresUserRepository(u)
	uc := app.NewUserUseCase(u, repo)

	// In the happy path, create user succeeds.
	t.Run("happy path", func(t *testing.T) {
		email := "john.appleseed@gmail.com"
		deviceID := "ios-123"

		// Act.
		// Wrap the operation in a transaction and rollback after the test complete.
		err := u.RunInTx(context.Background(), func(ctx context.Context) error {
			// Even though Register method calls `RunInTx`, it will not create a new
			// transaction.
			if err := uc.Register(ctx, email, deviceID); err != nil {
				t.Errorf("failed to register user: %v", err)
				return err
			}

			// Assert.
			// ...

			// Rollback the operation, instead of truncating the table for every tests.
			return ErrRollback
		})

		// The returned error must be ErrRollback.
		if err != nil && !errors.Is(err, ErrRollback) {
			t.Fatalf("failed to rollback: %v", err)
		}
	})
}
```


## Summary

_Unit of Work_ is a useful pattern when we need our operations to be atomic.
