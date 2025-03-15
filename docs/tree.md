# github-mcp-server - Directory Structure

Generated on: 2025-03-15 01:41:12


```
github-mcp-server
├── docs
    └── tree.md
├── scripts
    ├── clean.ts
    └── tree.ts
├── src
    ├── configuration
    │   ├── application.config.ts
    │   ├── configuration.types.ts
    │   ├── environment.config.ts
    │   └── index.export.ts
    ├── dependencyInjection
    │   └── tool.registry.ts
    ├── features
    │   ├── branchManagement
    │   │   ├── modifications
    │   │   │   ├── createBranch
    │   │   │   │   ├── create.branch.operation.ts
    │   │   │   │   ├── create.branch.types.ts
    │   │   │   │   └── index.export.ts
    │   │   │   ├── deleteBranch
    │   │   │   │   ├── delete.branch.operation.ts
    │   │   │   │   ├── delete.branch.types.ts
    │   │   │   │   └── index.export.ts
    │   │   │   └── index.export.ts
    │   │   ├── resources
    │   │   │   ├── listBranches
    │   │   │   │   ├── index.export.ts
    │   │   │   │   ├── list.branches.operation.ts
    │   │   │   │   └── list.branches.types.ts
    │   │   │   └── index.export.ts
    │   │   └── index.export.ts
    │   ├── fileManagement
    │   │   ├── modifications
    │   │   │   ├── updateFile
    │   │   │   │   ├── index.export.ts
    │   │   │   │   ├── update.file.operation.ts
    │   │   │   │   └── update.file.types.ts
    │   │   │   └── index.export.ts
    │   │   └── index.export.ts
    │   ├── issueManagement
    │   │   ├── modifications
    │   │   │   ├── createIssue
    │   │   │   │   ├── create.issue.operation.ts
    │   │   │   │   ├── create.issue.types.ts
    │   │   │   │   └── index.export.ts
    │   │   │   └── index.export.ts
    │   │   ├── resources
    │   │   │   ├── listIssues
    │   │   │   │   ├── index.export.ts
    │   │   │   │   ├── list.issues.operation.ts
    │   │   │   │   └── list.issues.types.ts
    │   │   │   └── index.export.ts
    │   │   └── index.export.ts
    │   ├── pullRequestManagement
    │   │   ├── modifications
    │   │   │   ├── createPullRequest
    │   │   │   │   ├── create.pull.request.operation.ts
    │   │   │   │   ├── create.pull.request.types.ts
    │   │   │   │   └── index.export.ts
    │   │   │   ├── mergePullRequest
    │   │   │   │   ├── index.export.ts
    │   │   │   │   ├── merge.pull.request.operation.ts
    │   │   │   │   └── merge.pull.request.types.ts
    │   │   │   ├── updatePullRequest
    │   │   │   │   ├── index.export.ts
    │   │   │   │   ├── update.pull.request.operation.ts
    │   │   │   │   └── update.pull.request.types.ts
    │   │   │   └── index.export.ts
    │   │   ├── resources
    │   │   │   ├── listPullRequests
    │   │   │   │   ├── index.export.ts
    │   │   │   │   ├── list.pull.requests.operation.ts
    │   │   │   │   └── list.pull.requests.types.ts
    │   │   │   └── index.export.ts
    │   │   └── index.export.ts
    │   ├── releaseManagement
    │   │   ├── modifications
    │   │   │   ├── createRelease
    │   │   │   │   ├── create.release.operation.ts
    │   │   │   │   ├── create.release.types.ts
    │   │   │   │   └── index.export.ts
    │   │   │   └── index.export.ts
    │   │   └── index.export.ts
    │   ├── repositoryManagement
    │   │   ├── modifications
    │   │   │   └── createRepository
    │   │   │   │   ├── create.repository.operation.ts
    │   │   │   │   ├── create.repository.types.ts
    │   │   │   │   └── index.export.ts
    │   │   ├── resources
    │   │   │   ├── getRepository
    │   │   │   │   ├── get.repository.operation.ts
    │   │   │   │   ├── get.repository.types.ts
    │   │   │   │   └── index.export.ts
    │   │   │   └── listRepositories
    │   │   │   │   ├── index.export.ts
    │   │   │   │   ├── list.repositories.operation.ts
    │   │   │   │   └── list.repositories.types.ts
    │   │   └── index.export.ts
    │   └── index.export.ts
    ├── services
    │   └── githubAccess
    │   │   ├── github.api.types.ts
    │   │   ├── github.rate.limiter.ts
    │   │   ├── github.response.mapper.ts
    │   │   ├── github.service.ts
    │   │   ├── github.service.types.ts
    │   │   └── index.export.ts
    ├── types
    │   ├── entity.definition.types.ts
    │   ├── error.definition.types.ts
    │   └── operation.result.types.ts
    ├── utilities
    │   ├── error.handling.utility.ts
    │   ├── promise.utility.ts
    │   ├── structured.logging.utility.ts
    │   ├── type.casting.utility.ts
    │   └── validation.utility.ts
    ├── application.entry.ts
    ├── index.ts
    └── types.ts
├── .env.example
├── LICENSE
├── package.json
├── README.md
└── tsconfig.json

```

_Note: This tree excludes files and directories matched by .gitignore and common patterns like node_modules._
