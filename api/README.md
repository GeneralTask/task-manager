# task-manager

## Application

The application is built as follows, there is an authentication step with
Google, which returns an exchange token. This token is then swapped for an OAuth
token from Google, along with an identity JWT token, used to parse user
details. With those details in hand, it becomes easy to query the google api's
for Calendar and GMail at need. In order to allow this, we persist user
information in an SQL database (currently SQLite, all though that may be swapped
with Postggres / MongoDB nigh on instantly). This also allows us to log in a
user, providing the framework for building on other authorizations like JIRA.

## Servant

The application herein is built with [servant](servant.dev), a type safe rest
API framework. The benefits of building upon such a framework are many and
varied, but a few, at the least should be touched upon. Because the API is
strongly typed, it is possible, via
[servant-client](https://hackage.haskell.org/package/servant-client) to
implement clients for the application without actually writing any code. This
includes swagger specifications, JavaScript request methods, sample curl calls,
etc... Because these are a direct result of the actual code in question, there
is no dangers of a specification becoming out of sync with the implementation.

## Performance

The application is built upon [Warp](https://hackage.haskell.org/package/warp)
a web server so blindingly fast it is said to compare well with `C`-level
programs. When built as a compiled executable it's possible (from past
experience) to create a statically compiled binary and drop it in a `Scratch`
Docker container, thus allowing us near instantaneous vertical scalability at
need.

### A Personal Note on Haskell

The one glaring difference from this approach to the previous is the choice of
language. Although I realize there is little to no familiarity with Haskell in
this project, there is a similar naivete concerning go, and it is my firm belief
that the speed, and quality, of application building in Haskell dramatically
outweigh the slightly increased cost of learning the language. I could, of
course, be wrong and this folder is condemned to being our projects Zoon, but
I'd like to point a few things: this project is the product of a little bit more
than 2 workdays. That was the time required to build the scaffold. From there,
it should be possible to implement features at a staggering rate. More
importantly, said features will be *safe* by the inherent properties of the
language and the framework we are using. There are other benefits enumerated in
the above document, but I can not stress that, as someone who has written
backend applications in a variety of languages, it is nearly impossible to beat
the development speed you can achieve in Haskell once the project is setup, as
this one is.
