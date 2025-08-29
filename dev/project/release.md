# Creating a new release

코드당의 production 환경은 `release` 브랜치를 기준으로 배포됩니다.
새로운 배포를 원하면 `release` 브랜치에 Pull Request를 생성하고, 운영진의 approve를 받아 merge하면 됩니다.

아래 링크를 이용해 main 브랜치에서 release 브랜치로 Pull Request를 생성할 수 있습니다.

https://github.com/skkuding/codedang/compare/release...main

## Rollback

새로운 배포에 문제가 발생한 경우, 가장 필요한 조치는 이전 commit으로 rollback하는 것입니다.
`release` 브랜치에서 이전 commit으로 revert하는 Pull Request를 생성하고, 운영진의 approve를 받아 merge하면 됩니다.

::: warning ⚠️ 주의사항
Prisma의 경우 자체적으로 migration rollback 기능을 제공하지 않습니다.
따라서, 데이터베이스 스키마 변경이 포함된 배포를 rollback할 때에는 revert 이전에 아래 링크를 참고하여 수동으로 migration을 생성하고 적용해야 합니다.

https://www.prisma.io/docs/orm/prisma-migrate/workflows/generating-down-migrations
:::

## Hotfix

main 브랜치를 그대로 release하는 대신, 긴급히 수정해야 하는 버그가 있을 때에는 `release` 브랜치에서 직접 Pull Request를 생성하여 수정할 수 있습니다.

## How release works

1. `release` 브랜치에 push 이벤트가 발생하면 GitHub Actions가 실행됩니다.
2. GitHub Actions는 필요한 이미지들을 빌드하고 GitHub Container Registry에 push합니다.
3. Argo CD Image Updater가 새로운 이미지를 감지하고, Argo CD에 알립니다.
4. Argo CD는 새로운 이미지를 사용하여 Kubernetes 리소스를 업데이트합니다.
