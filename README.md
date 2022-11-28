# typescript-typed-errors

A dependency-less library aiming to provide a set of utilities to bring proper error handling to Typescript with a small footprint.

It's inspired by Rust's Result, but we don't try to replicate every feature that Rust's Result offers, we instead use it as inspiration and bring functionality that is akin to the Typescript ecosystem.

# Example usage
## Core functionality
Let's say we have this piece of code:
```ts
import { userRepo } from './your-database' // some module in your codebase

class InvalidEmailException extends Error {
  name = 'InvalidEmailException'
  email: string

  constructor (email: string) {
    this.email = email
  }
}
class PasswordTooWeakException extends Error {
  name = 'PasswordTooWeak'
}
function createUser (email: string, password: string) {
  const emailParts = email.split('@') // just for demonstration purposes, you shouldn't use this to validate emails.
  if (emailParts[1] !== 'company.com') {
    throw new InvalidEmailException(email)
  }
  if (password.length < 8) {
    throw new PasswordTooWeakException()
  }
  const user = userRepo.new({ email })
  return user
}

const user = createUser('someemail@provider.com', '123123') // this will throw without us knowing about it until runtime
console.log(user.id) // this will never execute
```
This is unsafe to use because we can't know if createUser will success or not until runtime. Of course we can use a try ... catch 
```ts
try {
  const user = createUser('someemail@provider.com', '123123') // this will throw without us knowing about it until runtime
  console.log(user.id)
} catch (e) {
  if (e instanceof InvalidEmailException) {
    console.error('Invalid email provided:', e.email)
  }
  if (e instanceof PasswordTooWeak) {
    console.error('Provided password is too weak')
  }
}
```
But this will quickly become a nighmare to maintain as your application grow. You will need to keep track of exceptions thrown, for example using the [@throws syntax of JSDoc](https://jsdoc.app/tags-throws.html). Typescript wont force you to validate the exception before using the value. You'll also be generating a stack trace and you'll most likely wont need it, because that error is part of your application normal flow, so there is no need to debug it.

We can express the same flow as above using this library with the following code
```ts
import { Ok, Err, isOk, isErr } from 'typescript-typed-errors/core'
import { userRepo } from './your-database' // some function in your codebase

function createUser (email: string, password: string) {
  const emailParts = email.split('@')
  if (emailParts[1] !== 'gmail.com') {
    // we use 'as const' here so that our error code is not casted to a broad string type.
    return Err({ code: 'InvalidEmail' as const, email })
  }
  if (password.length < 8) {
    return Err({ code: 'PasswordTooWeak' as const })
  }
  const user = userRepo.new({ email })
  return Ok(user)
}

const user = createUser('someemail@provider.com', '123123')
if (isErr(user)) {
  if (user.error.code === 'InvalidEmail') {
    console.error('Invalid email provided', user.error.email)
  }
  if (user.error.code === 'PasswordTooWeak') {
    console.error('Provided password is too weak')
  }
} else {
  // now that we've verified user result is valid, we can access its value
  console.log(user.value)
}
```
Now we're forced to handle the error before accessing the result's value, and we've typings for the error, so we know what errors can we expect. We can also handle it using `isOk`:
```ts
const user = createUser('someemail@provider.com', '123123')
if (isOk(user)) {
  // now that we've verified user result is valid, we can access its value
  console.log(user.value)
} else {
  // handle our errors here
}
```
You might've noticed we haven't given a return type for our `createUser` function. Typescript will infer the type correctly if we omit it, but in some cases you might want to explicitly define it. If that's your case then you should use the `Result` interface.
```ts
import { Result /* ... */ } from 'typescript-typed-errors/core'
import { User } from './my-types'
// ...
function createUser (email: string, password: string): Result<{ code: 'InvalidEmail' } | { code: 'PasswordTooWeak' }, User> {
  // since we already defined our error code as constant on the return type, we wont need to use 'as const' when returning the error.
  // ...
}
```
The Left side of `Result` corresponds to the `Err` part. The Right side part corresponds to the `Ok` part. If we chose to explicitly define our return type as `Result`, we will get proper autocompletion when returning `Ok` or `Err`.

We're using the interface `{ code: 'ErrorCode' }` to define our errors for demonstration purposes, but you're not limited to it and are free to use whatever interface you find appropiate

You might be thinking that sometimes you dont want to handle the error directly but rather pass it up so the caller handle it. We've you covered, but that is not part of the core functionality, instead it is part of the utils and it can be imported separately.

## Utils
Now that we know the core functionality of the library, we can go to the interesting part. We've made some utils so handling errors is easier while still being type safe.
Let's say I just want to access the value of a result without caring about if its an error, but still do it on a safe manner, by passing the error up in case there is one and type it as my return type. We can do that using wrap and unwrap. 

```ts
import { Result, Ok, Err, isOk, isErr, wrap, unwrap } from 'typescript-typed-errors'
import { userRepo } from './your-database' // some function in your codebase

async function createUser (email: string, password: string): Result<{ code: 'InvalidEmail', email: string } | { code: 'PasswordTooWeak' }, User> {
  // ...
}

const createAdminUser = wrap<typeof createUser>()(
  // for wrap to work correctly, we need to use an async function because we rely on .catch to pass the error up
  async (email: string, password: string) => {
    const user = unwrap(await createUser(email, password))
    const update = { role: 'admin' }

    // since we've unwrapped user, we no longer need to access its value using .value nor validate it's a valid result using isOk.
    userRepo.updateById(user.id, update)
    return Ok({ ...user, ...update })
  },
)

const admin = createAdminUser('admin@company.com', '123123')
if (isErr(admin)) {
  // our error codes are inferred from createUser
  // admin.error.code is now an union of 'InvalidEmail' | 'PasswordTooWeak'
} else {
  // now that we've verified admin result is valid, we can access its value
  console.log(admin.value)
}
```
We're not limited to wrapping only one unwrap operation per function, we can unwrap as many as we want, we just need to make sure we pass the types of the functions we are unwrapping to the wrap helper function as type parameters, and we can even return our own errors, for example:

```ts
import { Result, Ok, Err, isOk, isErr, wrap, unwrap } from 'typescript-typed-errors'
import { userRepo } from './your-database' // some function in your codebase

async function createUser (email: string, password: string): Result<{ code: 'InvalidEmail' | 'PasswordTooWeak' }, User> {
  // ...
}

async function giveRole (userId: string, role: string): Result<{ code: 'RoleNotFound' }, true> {
  // ...
}

const createAdminUser = wrap<typeof createUser | typeof giveRole>()(
  async (email: string, password: string) => {
    const user = unwrap(await createUser(email, password))

    if (user.id > 100) {
      // this is an stupid error, just for demonstration purposes
      return Err({ code: 'IdAbove100' })
    }

    unwrap(await giveRole(user.id, 'admin'))
    return Ok(user)
  },
)

const user = createAdminUser('admin@company.com', '123123')
if (isErr(user)) {
  // user.error.code now is an union of: 'InvalidEmail' | 'PasswordTooWeak' | 'RoleNotFound' | 'IdAbove100'
} else {
  // now that we've verified user result is valid, we can access its value
  console.log(user.value)
}
```
There is no limit as how many levels you want to use unwrap, as long as you properly wrap it, the top-most caller function will get correct typing for all the errors possible. Functions being unwrapped don't need to be async, only the function where you're unwrapping them needs to be async.

## FAQ
### I want to get stack traces
If you want to get stack traces, then you just need to instantiate a new Error and return it using Err:
```ts
function fallibleFunctionWithStackTrace () {
  return Err(new Error('my error message'))
}
```
You still get typings for the error. We don't recommend using this for control flow errors, and just use it whenever you really need a stack trace.

### Why I need to import isOk and isErr to validate my result instead of just using result.isErr() and result.isOk()
For you to use result.isOk() we would need to instantiate a Result class whenever you returned a Result. Instead we just return a plain object that is identified as a result by using a symbol. This is a lot faster. Also, we use this library with some ES Modules, and [class instantiation is significantly slower on Node when using ESM compared to CJS](https://github.com/nodejs/node/issues/44186)

# Similar libraries
[fp-ts](https://github.com/gcanti/fp-ts) provides similar functionality, but the library is much bigger and is biased towards Functional Programming.

[ts-results](https://github.com/vultix/ts-results) is a Typescript implementation of Rust's Result and Option interfaces. This library offers an overall more complete set of utilities than our library, but lacks proper error propagation.

[oxide.ts](https://github.com/traverse1984/oxide.ts) another Typescript implementation of Rust's Result and Option interfaces, it also lacks error propagation.
