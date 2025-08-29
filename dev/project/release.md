# Creating a new release

코드당의 production 환경은 `release` 브랜치를 기준으로 배포됩니다.
새로운 배포를 원하면 `release` 브랜치에 Pull Request를 생성하고, 운영진의 approve를 받아 merge하면 됩니다.

아래 링크를 이용해 main 브랜치에서 release 브랜치로 Pull Request를 생성할 수 있습니다.

https://github.com/skkuding/codedang/compare/release...main

## How release works

1. `release` 브랜치에 push 이벤트가 발생하면 GitHub Actions가 실행됩니다.
2. GitHub Actions는 필요한 이미지들을 빌드하고 GitHub Container Registry에 push합니다.
3. Argo CD Image Updater가 새로운 이미지를 감지하고, Argo CD에 알립니다.
4. Argo CD는 새로운 이미지를 사용하여 Kubernetes 리소스를 업데이트합니다.
