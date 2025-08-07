# Remote Access to Kubernetes

원격으로 코드당의 Kubernetes 클러스터에 접근하는 방법을 소개합니다.

## 1. kubectl 설치

아래 공식 문서를 참고하여 kubectl을 설치해주세요.

https://kubernetes.io/ko/docs/tasks/tools

## 2. krew와 konfig 설치

- kubectl의 플러그인 관리 도구인 krew를 설치합니다. (https://krew.sigs.k8s.io/docs/user-guide/setup/install/)

- kubeconfig를 관리하는 konfig 플러그인을 설치합니다. (`kubectl krew install konfig`)

## 3. kubeconfig 파일 설정

스꾸딩 Notion의 Secrets 페이지에 있는 kubeconfig를 복사하여 로컬에 config.yaml 파일로 저장합니다.

이후 아래 명령어를 실행하여 kubeconfig에 저장합니다.

```
kubectl konfig import --save config.yaml
```

## 4. kubectl context 설정

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

## 5. VPN 접속 후 kubectl 사용

교내 VPN에 접속해야 클러스터에 접근할 수 있습니다.
아직 VPN을 신청하지 않았다면, [VPN 사용 안내](https://vpninfo.skku.edu/) 페이지를 참고하여 신청해주세요.

이후 자유롭게 kubectl 명령어를 사용할 수 있습니다.

```
❯ kubectl get nodes
NAME            STATUS   ROLES                  AGE   VERSION
skkuding-4f-2   Ready    control-plane,master   61d   v1.32.5+k3s1
skkuding-4f-3   Ready    <none>                 60d   v1.32.5+k3s1
skkuding-4f-4   Ready    <none>                 60d   v1.32.5+k3s1
```
