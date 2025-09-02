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

Kubernetes의 `imagePullPolicy`가 `Always`로 설정되어 있더라도, 클러스터에 배포된 Pod는 새로운 이미지가 나와도 자동으로 업데이트되지 않습니다.
Argo CD는 YAML에 변경이 있을 때만 리소스를 업데이트하고, 이미지 태그가 변경되지 않으면 새로운 이미지를 가져오지 않습니다.
이를 해결하기 위해 Argo CD Image Updater를 사용합니다.

Argo CD Image Updater는 컨테이너 이미지의 새로운 버전을 감지하고, Argo CD Application의 YAML을 자동으로 업데이트하여 새로운 이미지를 배포합니다.

먼저, Argo CD Image Updater를 설치합니다.

```bash
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj-labs/argocd-image-updater/stable/manifests/install.yaml
```

그 다음, 아래와 같이 Application에 annotation을 추가합니다.

```yaml{8-10}
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-app
  namespace: argocd
  finalizers:
    - resources-finalizer.argocd.argoproj.io
  annotations:
    argocd-image-updater.argoproj.io/image-list: <alias>=my-registry/my-image:tag
    argocd-image-updater.argoproj.io/<alias>.update-strategy: digest
spec:
  ...
```

위와 같이 annotation을 추가하면, Argo CD Image Updater가 `my-registry/my-image:tag`에 새로운 이미지가 있는지 주기적으로 확인합니다.
새로운 이미지가 감지되면, 해당 Application의 YAML을 업데이트하여 새로운 이미지로 변경합니다.

`digest` strategy는 해당 이미지 태그의 최신 digest를 사용하여 업데이트합니다.
이외에 다른 update strategy를 확인하고 싶다면 [공식 문서 'Update Strategies'](https://argocd-image-updater.readthedocs.io/en/stable/basics/update-strategies/)를 참고하세요.

### Using with ApplicationSet

ApplicationSet은 각 Application을 ApplicationSet의 템플릿에 정의된 값으로 관리합니다.
즉, Argo CD Image Updater가 Application의 YAML을 업데이트해도, ApplicationSet이 다시 기존 값으로 덮어씌우게 됩니다.
이를 해결하기 위해, ApplicationSet에 `ignoreApplicationDifferences` 설정을 추가하여 특정 필드를 무시하도록 할 수 있습니다.

```yaml{9-11}
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: frontend
  namespace: argocd
  finalizers:
    - resources-finalizer.argocd.argoproj.io
spec:
  ignoreApplicationDifferences:
    - jsonPointers:
        - /spec/source/kustomize/images
  ...
```

## Pull Request Preview

Argo CD의 ApplicationSet Generator 중 하나인 `pullRequest`를 사용하면, GitHub Pull Request마다 별도의 Application을 생성할 수 있습니다.

```yaml{11-17}
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: frontend-preview
  namespace: argocd
  finalizers:
    - resources-finalizer.argocd.argoproj.io
spec:
  goTemplate: true
  goTemplateOptions: ['missingkey=error']
  generators:
    - pullRequest:
        github:
          owner: skkuding
          repo: codedang
          appSecretName: github-app-secret # Required for higher API rate limit
        requeueAfterSeconds: 10 # Check for new PRs every 10 seconds
  template:
    metadata:
      name: '{{.number}}-preview-frontend'
      finalizers:
        - resources-finalizer.argocd.argoproj.io
    spec:
      ...
```

Argo CD에서는 GitHub API를 일정 시간마다 호출하여 Pull Request 목록을 가져오고, 각 Pull Request에 대해 별도의 Application을 생성합니다.
[GitHub API 공식 문서](https://docs.github.com/ko/rest/using-the-rest-api/rate-limits-for-the-rest-api?apiVersion=2022-11-28)에 따르면, 인증되지 않은 요청은 시간당 60회, 인증된 요청은 시간당 5,000회로 제한됩니다.
따라서 `appSecretName`에 GitHub Personal Access Token이 저장된 Kubernetes Secret을 지정하는 것이 좋습니다.
코드당은 'skkuding-bot' GitHub App을 사용하여 API 호출 제한을 늘리고 있습니다.

자세한 내용은 [공식 문서 'Pull Request Generator'](https://argo-cd.readthedocs.io/en/stable/operator-manual/applicationset/Generators-Pull-Request)를 참고하세요.

## Notifications

Argo CD Notifications는 Argo CD의 이벤트(동기화 상태 변경, 오류 등)를 다양한 채널(Slack, Email 등)로 알림을 보내는 기능입니다.
현재 코드당에서는 Pull Request Preview의 상태를 GitHub PR comment와 commit status로 알림을 보내고 있습니다.

Argo CD Notifications를 사용하려면, 먼저 Argo CD Notifications Controller를 설치해야 합니다.

```bash
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/notifications_catalog/install.yaml
```

그 다음, 필요한 secret 값을 Secret(`argocd-notifications-secret`)로 생성합니다.

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: argocd-notifications-secret
  namespace: argocd
type: Opaque
stringData:
  github-app-id: ...
  github-installation-id: ...
  github-private-key: ...
```

ConfigMap(`argocd-notifications-cm`)을 생성하여 알림 설정을 구성합니다.

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: argocd-notifications-cm
  namespace: argocd
data:
  service.github: |
    appID: $github-app-id
    installationID: $github-installation-id
    privateKey: $github-private-key

  trigger.on-sync-succeeded: |
    - when: app.status.sync.status == 'Synced' and app.status.health.status == 'Healthy'
      oncePer: app.status.operationState.syncResult.revision
      send: [github-succeed]

  template.github-succeed: |
    message: 'Successfully synced {{ .app.metadata.name }}'
    github:
      status:
        state: success
        label: "Argo CD / {{ .app.metadata.annotations.appName }}"
        targetURL: "{{ .context.argocdUrl }}/applications/{{ .app.metadata.name }}?operation=true"
      pullRequestComment:
        content: |
          ✅ **Syncing Preview App Succeeded**

          **Application:** `{{ .app.metadata.annotations.appName }}`
          **Revision:** `{{ .app.status.sync.revision }}`
          **Health Status:** {{ .app.status.health.status }}
```

### Service

알림 설정에 필요한 서비스 정보를 지정합니다.
위 예시에서는 GitHub 알림 설정을 위해 GitHub App 정보를 `service.github`에 지정했습니다.

### Trigger

알림을 트리거하는 조건을 정의합니다.
위 예시에서는 Application이 성공적으로 동기화되고, 상태가 Healthy일 때 `github-succeed` 알림을 보냅니다.
`oncePer` 필드를 사용하여 동일한 revision에 대해 한 번만 알림을 보내도록 설정했습니다.

더 많은 트리거 조건 목록은 [공식 문서 'Triggers and Templates Catalog'](https://argo-cd.readthedocs.io/en/stable/operator-manual/notifications/catalog/)를 참고하세요.

### Template

실제로 전송되는 알림 메시지의 형식을 정의합니다.
위 예시에서는 GitHub commit status와 Pull Request comment를 설정했습니다.

GitHub 알림 설정에 대한 자세한 내용은 [공식 문서 'GitHub Notifications'](https://argo-cd.readthedocs.io/en/stable/operator-manual/notifications/services/github/)를 참고하세요.
