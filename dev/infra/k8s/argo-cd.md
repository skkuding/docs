# Argo CD (GitOps)

Argo CD는 GitOps 방식을 지원하는 Kubernetes native 지속적 배포(CD) 도구입니다.
코드당에서 대부분의 Kubernetes 리소스는 Argo CD를 통해 배포 및 관리되고 있습니다.

<iframe style="border: 1px solid rgba(0, 0, 0, 0.1);" width="100%" height="450" src="https://embed.figma.com/board/XYQdgzT4zQEjpNP2IM2FPB/Codedang-Docs?node-id=1354-784&embed-host=share" allowfullscreen></iframe>

## GitOps

GitOps는 인프라 관리를 선언적으로 수행하는 방법론입니다.
모든 인프라 설정은 Git에 저장되며, 변경 사항은 pull request를 통해 관리됩니다.

Argo CD는 Git 저장소를 모니터링하고, 변경 사항이 감지되면 자동으로 Kubernetes 클러스터에 적용합니다.
즉 Git을 single source of truth로 사용하여, 다음과 같은 장점이 있습니다.

- 모든 변경사항이 Git에 기록되기 때문에 변경 이력을 쉽게 확인할 수 있습니다.
- Pull Request를 통해 변경 사항을 review하고 승인할 수 있습니다.
- Kubernetes 리소스의 상태를 Git과 동기화하여 일관성을 유지할 수 있습니다.
- 문제가 발생했을 때, 이전 상태로 쉽게 롤백할 수 있습니다. (Git revert)

## Application

Argo CD에서 배포는 Application 단위로 관리됩니다.
각 Application은 Git repository의 특정 경로를 모니터링하고, 해당 경로에 정의된 Kubernetes 리소스를 클러스터에 배포합니다.

::: warning ⚠️ 주의사항
GitOps 방식을 따르기 위해, Argo CD의 Application resource도 Git에 YAML로 저장되어 있어야 합니다.
Argo CD UI에서 직접 Application을 생성하거나 수정하는 것은 권장되지 않습니다.
:::

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-app
  namespace: argocd
  finalizers:
    - resources-finalizer.argocd.argoproj.io
spec:
  project: default
  source:
    path: path/to/manifests
    repoURL: https://github.com/skkuding/codedang
    targetRevision: main  # Git branch
  destination:
    name: stage  # Target cluster name
  syncPolicy:
    automated:
      prune: true  # Delete resources that are no longer defined
      selfHeal: true  # Automatically sync if out of sync
    syncOptions:
      - PrunePropagationPolicy=foreground
```

- `source`: Git repository와 경로를 지정합니다.
- `destination`: 배포할 Kubernetes 클러스터를 지정합니다. (클러스터 이름은 Argo CD에 미리 등록되어 있어야 합니다.)
- `syncPolicy.automated`: 자동 동기화 설정입니다. 자세한 내용은 [공식 문서](https://argo-cd.readthedocs.io/en/stable/user-guide/auto_sync/)를 참고하세요.
- `syncPolicy.syncOptions`: 동기화 옵션입니다. 자세한 내용은 [공식 문서](https://argo-cd.readthedocs.io/en/stable/user-guide/sync-options/)를 참고하세요.

### ApplicationSet

ApplicationSet은 Application의 묶음으로, 여러 Application을 한 번에 생성하고 관리할 수 있습니다.
여러 환경(production, stage)에 동일한 애플리케이션을 배포할 때 유용합니다.

```yaml{9-17}
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: my-app-set
  namespace: argocd
  finalizers:
    - resources-finalizer.argocd.argoproj.io
spec:
  goTemplate: true
  goTemplateOptions: ['missingkey=error']
  generators:
    - list:
        elements:
          - env: stage
            branch: main
          - env: production
            branch: release
  template:
    metadata:
      name: 'my-app-{{.env}}'
      finalizers:
        - resources-finalizer.argocd.argoproj.io
    spec:
      project: default
      source:
        path: 'path/to/manifests/{{.env}}'
        repoURL: https://github.com/skkuding/codedang
        targetRevision: '{{.branch}}'
      destination:
        name: '{{.env}}'
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
        syncOptions:
          - PrunePropagationPolicy=foreground
```

ApplicationSet은 `generators`와 `template`으로 구성됩니다.

- `generators`: Application을 생성하는 방법을 정의합니다. 위 예시에서는 `list` generator를 사용하여 두 개의 환경(stage, production)을 정의했습니다.
- `template`: 각 Application의 공통 설정을 정의합니다. <span v-pre>`{{.env}}`</span>와 <span v-pre>`{{.branch}}`</span>는 `generators`에서 정의한 값을 참조합니다.

더 많은 generator 유형과 설정 방법은 [공식 문서](https://argo-cd.readthedocs.io/en/stable/operator-manual/applicationset/Generators/)를 참고하세요.

## Argo CD Image Updater

## Pull Request Preview

## Notifications
