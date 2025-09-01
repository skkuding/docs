# Managing Secrets in Kubernetes

Kubernetes를 운영하면서 핵심 원칙 중 하나는 가능한 모든 Kubernetes manifest 파일을 Git에 저장하는 것입니다.
그러나 Secret resource는 민감한 정보를 포함하고 있어 이를 원본 그대로 Git에 저장하는 것은 보안상 매우 위험합니다.
이를 Kubernetes 클러스터에 안전하게 저장하고 관리하는 방법을 설명합니다.

## Sealed Secrets

Sealed Secrets는 Secret resource를 암호화하여 안전하게 Git에 저장할 수 있도록 합니다.
예를 들어 다음과 같은 Secret이 있다면,

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: my-secret
type: Opaque
stringData:
  username: admin
  password: supersecret
```

Sealed Secret로 변환하면 다음과 같이 됩니다.

```yaml
apiVersion: bitnami.com/v1alpha1
kind: SealedSecret
metadata:
  name: my-secret
spec:
  encryptedData:
    username: AgB2V...
    password: AgD9X...
  template:
    metadata:
      name: my-secret
    type: Opaque
```

::: warning ⚠️ 주의사항
Sealed Secret은 각 Cluster의 고유한 certificate로 암호화되기 때문에, 다른 Cluster에서는 사용할 수 없습니다.
따라서 production과 stage 등 서로 다른 Cluster에 적용하려면 각각의 Cluster에서 Sealed Secret을 생성해야 합니다.
:::

### Sealed Secret 변환 방법

Sealed Secret을 생성하려면 `kubeseal`를 설치해야 합니다.
설치 방법은 [공식 문서](https://github.com/bitnami-labs/sealed-secrets?tab=readme-ov-file#kubeseal)를 참고하세요.

1. Secret resource를 YAML 파일로 작성합니다.
   ```yaml
   apiVersion: v1
   kind: Secret
   metadata:
     name: my-secret
   type: Opaque
   stringData:
     username: admin
     password: supersecret
   ```
2. 해당 Secret을 적용하려는 Cluster의 context로 kubectl이 설정되어 있는지 확인합니다.
   ```bash
   kubectl config current-context

   # 원하는 context가 아니라면 다음과 같이 변경합니다.
   kubectl config use-context <context-name>
   ```
3. `kubeseal` 명령어를 사용하여 Sealed Secret로 변환합니다. 예를 들어, `my-secret.yaml` 파일을 `my-sealed-secret.yaml`로 변환하려면 다음과 같이 실행합니다.

   ```bash
   kubeseal -f my-secret.yaml -w my-sealed-secret.yaml
   ```
4. 변환된 Sealed Secret 파일을 Git에 저장하거나, `kubectl apply -f my-sealed-secret.yaml` 명령어로 클러스터에 적용합니다.

## External Secrets

External Secrets는 외부 비밀 관리 시스템(예: AWS Secrets Manager, HashiCorp Vault 등)과 Kubernetes Secret을 연동하는 도구입니다.
코드당에서 대부분의 경우 Sealed Secret을 사용하여 Secret을 관리하지만, AWS와 관련된 Secret은 AWS Secret Manager와 연동해 External Secrets를 사용하여 관리하고 있습니다.

### SecretStore와 ExternalSecret

External Secrets를 사용하려면 먼저 SecretStore를 정의해야 합니다.
SecretStore는 외부 비밀 관리 시스템에 대한 연결 정보를 포함합니다.
예를 들어 AWS Secrets Manager를 사용하는 SecretStore는 다음과 같이 정의할 수 있습니다.

```yaml
apiVersion: external-secrets.io/v1
kind: SecretStore
metadata:
  name: aws-secret-store
spec:
  provider:
    aws:
      service: SecretsManager
      region: ap-northeast-2
      auth:
        secretRef:
          accessKeyIDSecretRef:
            name: aws-credentials
            key: AWS_ACCESS_KEY_ID
          secretAccessKeySecretRef:
            name: aws-credentials
            key: AWS_SECRET_ACCESS_KEY
```

위 예시에서 `aws-credentials`라는 Secret에는 AWS IAM user의 Access Key ID와 Secret Access Key가 저장되어 있어야 합니다.
이 Secret은 External Secrets 컨트롤러가 AWS Secrets Manager에 접근하는 데 사용됩니다.

이후 ExternalSecret 리소스를 정의하여, 외부 비밀 관리 시스템에서 Secret을 가져와 Kubernetes Secret으로 생성할 수 있습니다.

```yaml
apiVersion: external-secrets.io/v1
kind: ExternalSecret
metadata:
  name: database-credentials
spec:
  refreshInterval: 5m  # 5분마다 Secret 갱신
  secretStoreRef:
    name: aws-secret-store
    kind: SecretStore
  target:
    name: database-credentials
    creationPolicy: Owner
  data:
    - secretKey: DATABASE_URL
      remoteRef:
        key: Codedang-Database-Secret
        property: url
```

위 예시에서는 `Codedang-Database-Secret`라는 이름의 AWS Secrets Manager secret에서 `url`이라는 property를 가져와, Kubernetes Secret인 `database-credentials`의 `DATABASE_URL` key로 저장합니다.

## Mirroring secrets across namespaces

Kubernetes에서 모든 resource는 namespace에 종속됩니다.
즉, 하나의 namespace에 생성된 Secret은 다른 namespace에서 접근할 수 없습니다.
하지만 같은 내용을 가진 Secret을 여러 namespace에 생성해야 하는 경우가 있습니다.
예를 들어 RabbitMQ의 namespace에 저장된 사용자 인증 정보를 다른 서비스의 namespace에서도 사용해야 하는 경우입니다.

코드당에서는 [kubernetes-reflector](https://github.com/emberstack/kubernetes-reflector)를 이용하여 특정 namespace의 Secret을 다른 namespace로 복제(mirror)하고 있습니다.
예를 들어 다음과 같은 Secret을 복제하려고 한다면,

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: rabbitmq-auth
  namespace: rabbitmq
  annotations:
    reflector.v1.k8s.emberstack.com/reflection-allowed: "true"
type: Opaque
stringData:
  username: rabbituser
  password: rabbitpassword
```

위와 같이 `reflector.v1.k8s.emberstack.com/reflection-allowed: "true"` annotation을 추가합니다.
이는 reflector가 이 Secret을 복제할 수 있도록 허용하는 역할을 합니다.

실제로 복사될 Secret에는 다음과 같은 annotation을 추가합니다.

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: rabbitmq-auth  # Can be renamed if needed
  namespace: my-service-namespace
  annotations:
    reflector.v1.k8s.emberstack.com/reflects: "rabbitmq/rabbitmq-auth"
```

위와 같이 `reflector.v1.k8s.emberstack.com/reflects` annotation을 추가하여, 이 Secret이 어느 namespace의 어떤 Secret을 복제할지 명시합니다.

::: warning ⚠️ 주의사항
많은 경우에 reflector가 유용하지만, External Secrets와 연동하는 경우에는 reflector를 사용하지 않는 것이 좋습니다.
각 서비스마다 External Secrets에 접근하기 위한 IAM 권한이 다르기 때문에, 각 서비스의 권한을 제어할 수 있도록 External Secrets를 직접 사용해야 합니다.
:::

### Sealed Secret과 함께 사용하기

Sealed Secret과 reflector를 함께 사용할 수도 있습니다.
다만 Sealed Secret은 다음과 같이 annotation을 Sealed Secret resource가 아닌, template.metadata에 추가해야 합니다.

```yaml
apiVersion: bitnami.com/v1alpha1
kind: SealedSecret
metadata:
  name: rabbitmq-auth
spec:
  encryptedData:
    username: AgB2V...
    password: AgD9X...
  template:
    metadata:
      name: rabbitmq-auth
      annotations:
        reflector.v1.k8s.emberstack.com/reflection-allowed: "true"
    type: Opaque
```
