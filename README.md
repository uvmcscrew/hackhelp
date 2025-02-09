# HackHelp

HackHelp is a portal created to simplify team management, GitHub permission handling, & help ticketing for teams at the 2025 UVM Hackathon.

## About HackHelp

For 2025, we decided to standardize on GitHub, and will require everyone to hold their work in the same GitHub organization. Repositories will be private, with teams inside the org given admin permission on their repositories. This way, people can more easily manage access to repositories, event organizers can easily find teams' code, and at the end of the whole thing, we can open source it all.

All logins are handled via GitHub OAuth. On every signup, the login callback checks various states:

#### New Users

_ie they do not exist in the database_

**If the user is already in the Github Organization:** Their whitelist status is automatically updated and they are allowed to access their home page.
If a user logs in who has the `Owner` role in the configured github organization, they are automatically promoted to administrator and can access the admin dashboard.

**If the user is not whitelisted:** They are quarantined to the account page, where a status badge tells them to contact event organizers.

**If the user _is_ whitelisted and is not part of the Github Organization:** They are not allowed to access the user home page. However, their account page will allow them to request an invitation to the organization.

_What does whitelisted mean?_
The whitelisting feature means that we can upload a series of GitHub usernames (or enter single ones at at a time) into the system before those users have ever logged in themselves. This way, we don't have to manually invite every single competitor one by one.

#### Existing Users

The system will check both with Github and the database to determine what states should be updated.

If the user is part of the organzation, their whitelist status will update.

If a user logs in who has the `Owner` role in the configured github organization, they are automatically promoted to administrator and can access the admin dashboard.

### Team/User Permission Management

> [!WARNING]
> This portion has not been completed yet.

Teams are required to store all code artifacts in a git repository on GitHub, in the hackathon organization. This is for a few reasons:

1. Git is an industry standard tool, and GitHub often accompanies it. We want to encourage the use of popular tools.
2. Event organizers need to be able to audit code to make sure certain rules are being followed (e.g. start/stop time, reasonable AI use, etc)
3. Mentors need to be able to access a team's codebase to assist them. With this system, they will be able to do so automatically, without the team having to provide any information other than a help request.

One catch we need to be careful of here is that a team's code should remain private during the competition; this requires careful permission handling. This system automatically takes care of that.

When a team is created in HackHelp, it is also created as Github Team. Whenever members are added or removed from the team in the system, it automatically updates permissions so that all team members maintain access to their repository or repositories.

### Ticketing

> [!WARNING]
> This portion has not been completed yet.

Tickets are an abstraction on top of GitHub issues. When a team creates a ticket, they link it to an issue in their repository. This allows competitors to leave comments in Markdown format, link to their code, and generally utilize the GitHub platform. The HackHelp system only stores high-level competition specific metadata for a ticket; specifically, the team's physical location, what tools/languages/concepts the request pertains to, the assigned mentor who will help them, and whether the ticket is resolved. The resolution status is tracked separately from whether the issue is closed within GitHub to provide teams maximum flexibility.

Mentors will have access to the admin dashboard where there will be a feed of tickets. They can assign themselves as the designated help person, and also filter the view for help tickets that the are assigned to and/or are best suited to help with.

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
