## Project setup

```bash
$ npm install
```

## Compile and run the project

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```
## Contribution Guidelines
## 1. Clone the Repository
Clone the repository to your local machine:
```bash
git clone https://github.com/your-team/repository-name.git
cd repository-name
```

## 2. Create a New Branch
Always create a new branch for your changes:
```bash
git checkout -b feature/your-branch-name
```
Use a descriptive branch name that reflects the task or feature, e.g., `feature/login-page` or `bugfix/fix-login-error`.

## 3. Make Your Changes
Implement your changes in the appropriate files. Ensure your work aligns with the project's coding standards and conventions.

## 4. Commit Your Changes
Stage and commit your changes with a clear and descriptive commit message:
```bash
git add .
git commit -m "Descriptive message about your changes"
```

## 5. Sync With the Main Branch
Before pushing your branch, ensure it's up to date with the latest changes from the main branch:
```bash
git fetch origin
git checkout main
git pull origin main
git checkout feature/your-branch-name
git merge main
```
Resolve any merge conflicts, if necessary.

## 6. Push Your Changes
Push your branch to the remote repository:
```bash
git push origin feature/your-branch-name
```

## 7. Create a Pull Request (PR)
1. Go to the repository on GitHub.
2. Navigate to the **Pull Requests** tab and click the **New Pull Request** button.
3. Select your branch as the source branch and `main` as the target branch.
4. Add a clear and concise title and description for your PR, explaining what you’ve changed and why.

## 8. Assign a Reviewer and Notify Them
1. Assign a reviewer to your PR using GitHub's **Assignees** feature.
2. Notify the reviewer via Telegram or your team's preferred communication channel to review your PR.

## 9. Respond to Feedback
Address any feedback provided by the reviewer promptly. Once all changes are approved, the reviewer will merge the PR into the main branch.

