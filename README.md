# HackHelp

HackHelp is a portal created to help manage GitHub access & other stuff for teams at the UVM Hackathon.

For 2025, we decided to standardize on GitHub, and require everyone to hold their work in the same GitHub organization. Repositories will be private, with teams inside the org given admin permission on their repositories. This way, people can more easily manage access to repositories, event organizers can easily find teams' code, and at the end of the whole thing, we can open source it all.

The other major feature of this system is ticketing. At the event, we have mentors who help students with their code. This system is how teams notify mentors that they need help; including a description of their problem and reasons why.

## Contributing

**Prerequisites**

- [Bun](https://bun.sh)
- A PostgreSQL database
- Github App Credentials

#### Set up environment variables

| Env Var                    | Description                                             |
| -------------------------- | ------------------------------------------------------- |
| `DATABASE_URL`             | The url of your PostgreSQL database                     |
| `GITHUB_APP_ID`            |                                                         |
| `GITHUB_APP_PRIVATE_KEY`   |                                                         |
| `GITHUB_APP_CLIENT_ID`     | OAuth Client ID of the Github App                       |
| `GITHUB_APP_CLIENT_SECRET` | OAuth Client Secret of the Github App                   |
| `PUBLIC_GITHUB_ORGNAME`    | The slug of the GitHub Org that HackHelp should control |

#### Install Dependencies

```sh
bun install
```

#### Run database migrations

```sh
bun db:migrate
```

#### Run the development server

```sh
bun dev
```

then visit http://localhost:5173

## Credits

- https://themes.fkaya.dev/ (theme generator)

## License

This project is licensed under the [MIT License](./LICENSE)
