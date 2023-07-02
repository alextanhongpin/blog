---
title: Feature-Driven Development using Templates
tags:
- usecase
---


Feature-Driven-Development (FDD) focuses on building and adding new features. Domain-Driven-Development (DDD) could serve as the initial starting point when working on new projects. However, we often spend time adding new features instead of working on a domain. Also, most projects have already split the repository into their respective domains.

## Using a Template System

Templates help bring order to chaos. When working on features, it is easy to get distracted from the goal and get blocked in the process. Having a consistent methodology helps keep this clear. The template serves the following purpose:

- reproducible: you can apply it over and over again for different projects
- repeatable: you can get results from the template
- adaptable: you can adjust the template to suit your needs for different projects


The **PGM (Problem, Goal, Metrics)** template structure is as follows:

- Problem: identify the root cause. Produce a _problem statement_.
- Goal: from the problem, set a goal to minimize the problem. Produce a _user story_ and _justification template_.
- Metrics: measure the effectiveness of our solution, and compare it against our expectations. Produce a _metric expectation template_.

### Identifying the Problem

Always start with a _problem statement_. Before coming up with the feature that solves that problem, you first need to understand the problem you are attempting to solve.

For example, say we are running an online e-commerce startup. Based on the users' feedback, we formulate the following _problem statement_:

> Users have difficulty making purchases because the items that they want are always out of stock. Often, they have to keep checking the items to see if it is available, which leads to frustration and a poor user experience.


### Identifying the Goal

Once we know the problem we are attempting to solve, we can now work towards our goal. Having a clear goal is important so that you can plan the journey ahead. We can depict our goals using a [user story](https://www.atlassian.com/agile/project-management/user-stories#:~:text=software%20user's%20perspective.-,A%20user%20story%20is%20an%20informal%2C%20general%20explanation%20of%20a,value%20back%20to%20the%20customer.). The _user story_ template is as follows:

```md
As a [persona],
I [want to],
[so that].
```

Our user story would look like this:

```md
As a user,
I want to be notified on immediate restock of an item,
In order to be able to purchase the item.
```

The user story should not leak any implementation details of the feature. Since there could be multiple solutions to a problem, each with different complexity and trade-offs, we need to constantly measure and iterate. As a rule of thumb, always start with a naive solution and iterate your way through it.

The problem above could be solved through the following features:

- allow users to bookmark the items they want to keep track of. Users can then sort by newly restocked items.
- allow users to subscribe to the items, and send a push notification on restock
- create a separate page that shows recently restocked items
- add a label to the products that have been recently restocked
- allow searching/filtering/sorting for newly restocked items


Once we have selected the best solution, we justify them with the _justification template_:

```md
After <decision trigger>
We decided to go with <solution, and a short description on how it works>
Because <pros>
Even though <cons>
Other options are <optional, list of alternatives and optionally their pros/cons>
```

> After conducting extensive user research, we decided to go with restock notification subscription, allowing users to subscribe to items and receive notifications when the items are restocked, because this option seems to be the most engaging to users and users can receive real-time notification, even though sending notifications may cost more.

### Identifying the Metrics

Every feature must have _measurable outcomes_. The metrics are measured over a period of time (by day, week, or month). For each metric, we indicate our _expectations_ using the **Metric Expectation Template (MET)**:

> We want to measure \<metric\>, expecting \<expectations\>

- we want to measure the number of subscriptions, expecting the rate to grow month-on-month
- we want to measure the number of successful notifications sent, expecting the success rate to be higher than the failure rate
- we want to measure the number of failed notifications sent, expecting the error rate to be below 1%
- we want to measure the success of purchases after receiving the notification, expecting a non-zero amount

## Diving into the Feature

Once we know what the problem is and the preferred solution, we can start diving deeper into the building blocks of the feature.

- identifying actors
- identifying elements
- identifying behaviours and interactions between elements
- identitying business logic
- identifying scenarios, interaction between elements with the environment and actor
- identifying edge cases and blockers

### Identifying actors

The actor is the user who will be using this feature. In this case, the actor must be a registered and logged-in user of the app. A premium membership is also required to access this feature.

If this is a feature that you want to rollout incrementally, you can define the actors as beta users that receive invitations to try out the feature.

### Identifying elements

Elements are simply the simplest building blocks of the feature. It can simply be an object with multiple attributes, which could be stored in the database.

For our feature, we want to allow users to create `Subscriptions` to an `Item` of desire. A user can set the `quantity` they are interested in purchasing. When the item is restocked with a quantity matching the desired quantity, then the user will receive a `Notification`.

```typescript
interface Subscription {
    // The quantity the user is interested to purchase.
    quantity: number

    // The itemId referencing the Item the user is watching.
    itemId: string
}
```

### Identifying behaviours

This step answers what we can do with the _object_. This usually covers the lifecycle of the _object_, which includes the CRUD of the object.

For example, user can:
- create subscription (subscribe)
- update subscription
- delete subscription (unsubscribe)

The system can:
- create notification

### Identifying business logic

In this step, we should discuss with the stakeholders on the capability as well as limitation of the system. We need to think of the boundary of each elements, which includes:

- min/max limit
- zero scenario (when it doesn't exists)
- one, two or many (when too many)
- exceptions/forbidden actions
- duplicate
- start/end/repeat of usecase (after completion, what happens)?
- failure/success scenarios
- access control, roles and permission
- pagination amount

We can answer the following questions with **5W1H**:
- how many subscriptions can the user create? max 10
- how many users can create a subscription? all registered, premium users.
- what is the min/max subscriptions? min 1, max 1000
- what if there are no notifications? show a placeholder
- how many notifications to list? 20
- can a user subscribe multiple times to the same item? no

### Identifying scenarios

We identified the following scenarios here, which we will elaborate on further with the [use case templates](https://www.wordtemplatesonline.net/use-case-template-examples/).
- user create subscription
- user update subscription
- user delete subscription
- admin increment stocks
- system send restock notification


At the very least, it should cover the main success scenarios:

```md
Scenario: User create subscription

Steps:
1. User goes to Product Page
2. User attempts to purchase above limit/Item is out of stock
3. System shows the option to subscribe
4. User subscribe
5. System creates the Subscription
6. System notify User that Subscription is created

Extensions:
3a. User is already subscribed, System shows option to edit the Subscription
5a. User is forbidden, System returns error
```

### Writing pseudocode

Writing pseudocode is useful for initial reviews and encourages early feedback.

```typescript
interface RestockNotificationSubscription {
    id: string
    userId: number
}

// createRestockNotificationSubscription creates a new restock notification subscription.
async function createRestockNotificationSubscription(userId: string, itemId: string, quantity: number): RestockNotificationSubscription {
    checkUserIsPremium(userId)
    checkItemExists(itemId)
    checkQuantityIsValid(quantity)
    checkNotificationIsNotYetCreated(userId, itemId)

    const subscription = await repo.createRestockNotificationSubscription(userId, itemId, quantity)
    return subscription
}

interface StocksCountChangedEvent {
    itemId: string
    oldQuantity: number
    newQuantity: number
}

// watchStocksCount is responsible for checking the change in stocks count and sending the notification.
async function watchStocksCount({ itemId, newQuantity }: StocksCountChangedEvent) {
    const subscriptions = await repo.findRestockNotificationSubscriptionsMatchingItemAndQuantity(itemId, newQuantity)
    if (!subscriptions.length) return

    const results = await Promise.allSettled(subscriptions.map(sendRestockNotification))
    const successfulResults = filterSuccessful(results)
    const failureResults = filterFailure(results)
    await repo.updateSuccessful(successfulResults)
    await repo.updateFailureResults(failureResults)
}
```

## Iterate and document

There is no last step. We will continuously iterate and make adjustments accordingly. For example, after deploying the system, we may find the following new problems:



- What if many people subscribed (1 million subscribers) to the same item? This will overload the notification system. Also, if the first user purchases all the stocks, other users will be notified but will see no stocks left if they are late. We prioritize users with more quantity, and recent activity. Send to the first batch first, and then after n durations, if the stock is still available, send to the subsequent batch.
- The change in stock count is causing a query every time the stock quantity changes, which can be bad for performance. We can batch the requests. Or even better, we only watch the changes whenever the stocks are incremented.

The pseudocode below shows the improvement to the system after identifying the new problems:

```typescript
// watchStocksCount is responsible for checking the change in stocks count and sending the notification.
async function watchStocksCount({ itemId, oldQuantity, newQuantity }: StocksCountChangedEvent) {
    const isRestock = oldQuantity < newQuantity
    if (!isRestock) return

    // Limit to first 1000 subscribers that has not yet received the restock notification.
    // The reason is the demand is higher than the supply. So if we send to all users,
    // then they may see the item as out of stock if the stocks were purchased by earlier buyer.
    const LIMIT = 1_000

    const subscriptions = await repo.findRestockNotificationsMatchingQuantity(itemId, newQuantity, LIMIT)
    if (!subscriptions.length) return

    const results = await Promise.allSettled(subscriptions.map(sendRestockNotification))
    const successfulResults = filterSuccessful(results)
    const failureResults = filterFailure(results)
    await repo.updateSuccessful(successfulResults)
    await repo.updateFailureResults(failureResults)
}
```
