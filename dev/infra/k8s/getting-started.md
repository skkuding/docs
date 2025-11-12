# Getting Started with Kubernetes

코드당은 Stateless한 서비스들을 동아리 서버 내 Kubernetes 클러스터에 배포하여 운영하고 있습니다.
Kubernetes의 복잡한 개념과 설정이 처음 접하는 분들에게는 어려울 수 있지만, **'정의된 상태(desired state)를 최대한 유지한다'** 는 Kubernetes의 철학을 이해하면, 조금 더 쉽게 이해할 수 있습니다.

## Why Kubernetes?

코드당은 원래 AWS ECS를 사용하여 서비스를 운영했지만, 비용 절감을 위해 on-premise 서버로 이전하였습니다.
이 과정에서 여러 대의 서버에서 서비스를 안정적으로 운영하기 위해 Orchestration tool이 필요했고, 그 중 널리 사용되는 Kubernetes를 선택하였습니다.
Kubernetes의 주요 장점은 다음과 같습니다.

- **Declarative Configuration**: YAML로 리소스를 정의하면 Kubernetes가 알아서 상태를 유지합니다.
- **GitOps Friendly**: Argo CD와 같은 도구를 사용하여 대부분의 설정을 Git에 저장하고 관리할 수 있습니다. 이를 통해 Pull Request, 리뷰, 변경 history 등 다양한 best practice를 적용할 수 있습니다.
- **Scalability**: 필요에 따라 쉽게 리소스를 확장하거나 축소할 수 있습니다.
- **Self-Healing**: 장애가 발생한 pod를 자동으로 재시작하거나 교체합니다.
- **Ecosystem**: 다양한 오픈소스 도구와 플러그인을 활용할 수 있습니다.

## Learning kubernetes

Kubernetes는 매우 방대한 주제이기 때문에, 모든 개념을 이해하기 보다는 필요한 부분만 익히며 점점 지식을 쌓아가는 것을 추천합니다.
실제로 Kubernetes는 각 기능별로 추상화가 잘 되어있어, 필요한 개념만 이해해도 충분히 활용할 수 있습니다.

아직 Docker와 컨테이너에 익숙하지 않다면, Subicura 님의 ['초보를 위한 도커 안내서'](https://subicura.com/2017/01/19/docker-guide-for-beginners-1.html)를 먼저 읽어보는 것을 추천합니다. (총 3편)

Kubernetes를 처음 접하는 분들에게는 ['쿠버네티스 안내서'](https://subicura.com/k8s/)를 따라가보며 기초 개념을 쌓는 것을 추천합니다.

## Core Principles

코드당의 Kubernetes 클러스터 운영의 핵심 원칙은 다음과 같습니다.

- 모든 변경 및 새로운 기능은 stage 환경에서 실험하고, production 환경에 배포하는 워크플로우를 권장합니다.
- 모든 Kubernetes manifest 파일은 Git에 저장되어야 합니다. (Helm chart, 외부 서비스는 예외)
- 민감한 정보는 Sealed Secret을 사용하여 안전하게 관리합니다. ([Sealed Secret 페이지 참고](./secrets.md#sealed-secrets))
- 모든 resource는 namespace로 격리합니다. `default` namespace는 사용하지 않습니다.

## Remote Access to Kubernetes

원격으로 코드당의 Kubernetes 클러스터에 접근하는 방법을 소개합니다.

### 1. kubectl 설치

아래 공식 문서를 참고하여 kubectl을 설치해주세요.

https://kubernetes.io/ko/docs/tasks/tools

### 2. krew와 konfig 설치

- kubectl의 플러그인 관리 도구인 krew를 설치합니다. (https://krew.sigs.k8s.io/docs/user-guide/setup/install/)

- kubeconfig를 관리하는 konfig 플러그인을 설치합니다. (`kubectl krew install konfig`)

### 3. kubeconfig 파일 설정

스꾸딩 Notion의 Secrets 페이지에 있는 kubeconfig를 복사하여 로컬에 config.yaml 파일로 저장합니다.

이후 아래 명령어를 실행하여 kubeconfig에 저장합니다.

```
kubectl konfig import --save config.yaml
```

> 중요: kubeconfig가 보관되는 디렉터리(`~/.kube`)가 없으면 명령이 실패할 수 있습니다. 아래 명령으로 디렉터리를 미리 생성하세요.

```
mkdir -p ~/.kube
```

### 4. kubectl context 설정

`kubectl config get-contexts` 명령어를 실행하여 현재 설정된 context를 확인합니다.
잘 설정되어있다면 prod와 staging 두 개의 context를 볼 수 있습니다. (기존 context가 있다면 추가로 생성됩니다.)

```
❯ kubectl config get-contexts
CURRENT   NAME    CLUSTER   AUTHINFO     NAMESPACE
*         prod    prod      prod-user
          stage   stage     stage-user
```

이후 원하는 context를 선택합니다. 예를 들어 prod context를 사용하고 싶다면 아래 명령어를 실행합니다.

```
kubectl config use-context prod
```

### 5. VPN 접속 후 kubectl 사용

교내 VPN에 접속해야 클러스터에 접근할 수 있습니다.
아직 VPN을 신청하지 않았다면 [VPN 사용 안내](https://vpninfo.skku.edu/) 페이지를 참고하여 신청해주세요.

이후 자유롭게 kubectl 명령어를 사용할 수 있습니다.

```
❯ kubectl get nodes
NAME            STATUS   ROLES                  AGE   VERSION
skkuding-4f-2   Ready    control-plane,master   61d   v1.32.5+k3s1
skkuding-4f-3   Ready    <none>                 60d   v1.32.5+k3s1
skkuding-4f-4   Ready    <none>                 60d   v1.32.5+k3s1
```

## Tips

- `alias k=kubectl`을 사용하여 명령어를 간단하게 줄일 수 있습니다.
- [kubectx와 kubens](https://github.com/ahmetb/kubectx)를 사용하여 context와 namespace를 쉽게 전환할 수 있습니다.
- [fzf](https://github.com/junegunn/fzf?tab=readme-ov-file)를 사용하면 CTRL+R로 이전에 사용한 명령어를 쉽게 검색할 수 있습니다.
- Kubernetes 대시보드를 사용하여 클러스터를 더 쉽게 관리할 수 있습니다. 로그 확인이나 pod 내부 터미널 접속 등이 가능합니다.
- 클러스터에 변경하기 전 Argo CD의 auto-sync를 일시적으로 비활성화하는 것을 권장합니다.
