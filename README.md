# HackHelp

HackHelp is a portal created to simplify team management, GitHub permission handling, & help ticketing for teams at the 2025 UVM Hackathon.

**See more information on the repo wiki =>** https://github.com/uvmcscrew/hackhelp/wiki

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

### Development Notes

#### Code Line Counting

```sh
# Counting excluding installed ui components
# see .tokeignore
tokei
# Counting everything
tokei --no-ignore
```

##### Feb 26th 2025 at 21:32

```
===============================================================================
 Language            Files        Lines         Code     Comments       Blanks
===============================================================================
 CSS                     1           78           56            0           22
 HTML                    1           12           12            0            0
 JavaScript              2           53           43            6            4
 JSON                    3          130          130            0            0
 Markdown                1          109            0           67           42
 SVG                     1           11           10            1            0
 TypeScript             41         2300         1928           86          286
-------------------------------------------------------------------------------
 Svelte                 41         1268         1208            0           60
 |- JavaScript          36          648          547            5           96
 (Total)                           1916         1755            5          156
===============================================================================
 Total                  91         3961         3387          160          414
===============================================================================
```

## Credits

- https://themes.fkaya.dev/ (theme generator)

## License

This project is licensed under the [MIT License](./LICENSE)
