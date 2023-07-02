---
title: Deferred Logging
tags:
- golang
- logging
---


## Problem

We want to avoid logging too much to avoid generating huge amount of logs. But at the same time, we want to avoid losing important information that is not logged.

In `production` environment, the logs are usually configured to log up to `INFO` level. So any logs below the `INFO` level will not be visible.


However, when an error occured, we may want to log all logs with the level `DEBUG` and `TRACE`.

Logs with `DEBUG` level usually guides step-by-step on what path the request took to hit the error, while those with `TRACE` level usually contains information such as SQL queries or HTTP requests.

Toggling them dynamically is not an option, as the issue may no longer be reproducible.


## Proposed Solution

The proposed solution is quite simple. One of common approach is to use `ring buffer logging`, where we buffer all the logs before printing them. When there are logs of level `ERROR`, then we flush all of the existing logs.


In `golang`, we can achieve this without implementing a ring buffer. All we need is a simple `defer` statement to delay the logging execution. When an error occurred, we can then update the logger's log level to `DEBUG`.


Before getting into the code, let us visualize how it would look.

In normal situation, only `INFO`-level logs will be printed.

```bash
➜  examples git:(main) ✗ go run main.go
time=2023-07-03T00:10:19.632+08:00 level=INFO msg="called Bar" req_id=cigq2qvltaq0dcj5tat0
```

However, when an error occured, all logs level will be printed.
```bash
➜  examples git:(main) ✗ go run main.go
time=2023-07-03T00:10:17.085+08:00 level=ERROR msg="failed to call Bar" req_id=cigq2q7ltaq0d1n2nle0
time=2023-07-03T00:10:17.340+08:00 level=DEBUG msg="called Bar" req_id=cigq2q7ltaq0d1n2nle0 elapsed=342ns
time=2023-07-03T00:10:17.340+08:00 level=DEBUG msg="called Foo" req_id=cigq2q7ltaq0d1n2nle0 elapsed=458ns
```


The repository for this example can be found [here](https://github.com/alextanhongpin/go-slog-ring-buffer/tree/main/examples).


We first define the interface of our logger:

```go
type logger interface {
	ErrorCtx(ctx context.Context, msg string, attrs ...slog.Attr)
	DebugCtx(ctx context.Context, msg string, attrs ...slog.Attr)
	InfoCtx(ctx context.Context, msg string, attrs ...slog.Attr)
	/* Add other levels when required */
}
```

For the implementation, we want to be able to toggle the logger's level when it is `ERROR`:

```go
func (l *Logger) ErrorCtx(ctx context.Context, msg string, attrs ...slog.Attr) {
	l.LogAttrs(ctx, slog.LevelError, msg, attrs...)
}

func (l *Logger) LogAttrs(ctx context.Context, level slog.Level, msg string, attrs ...slog.Attr) {
	if level == slog.LevelError {
		// Enable up to DEBUG level.
		l.LevelVar.Set(slog.LevelDebug)
	}

	l.Logger.LogAttrs(ctx, level, msg, attrs...)
}
```

In our application, we can then just `defer` the logging. When we log an error, then the logger's level will be updated, and the previously deferred log will the be executed:


```go
package main

import (/* !REDACTED */)

func main() {
	ctx := context.Background()
	Foo(ctx, NewLogger())
}

func Foo(ctx context.Context, l logger) {
	start := time.Now()
	defer l.DebugCtx(ctx, "called Foo", slog.Duration("elapsed", time.Since(start)))

	time.Sleep(250 * time.Millisecond)

	Bar(ctx, l)
}

func Bar(ctx context.Context, l logger) {
	start := time.Now()
	defer l.DebugCtx(ctx, "called Bar", slog.Duration("elapsed", time.Since(start)))

	isErr := rand.Intn(2) < 1
	if isErr {
		l.ErrorCtx(ctx, "failed to call Bar")
	} else {
		l.InfoCtx(ctx, "called Bar")
	}

	time.Sleep(250 * time.Millisecond)
}
```


## Summary

You can simulate ring buffer logging using `defer` statement in `golang`.
