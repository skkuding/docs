# Operator Pattern

Kubernetes에서 Operator pattern은 '정의된 상태(desired state)를 유지한다'는 Kubernetes의 핵심 개념을 확장한 패턴입니다.
코드당에서 직접 구현해서 사용하지는 않지만, RabbitMQ나 Redis, Argo CD와 같은 여러 서비스에서 Operator를 제공하고 있습니다.

## Custom Resource Definition (CRD)

Kubernetes manifest를 작성할 때, `apiVersion`, `kind` 등의 필드를 사용합니다.
이러한 필드들은 Kubernetes API에서 리소스를 식별하는 데 사용됩니다.
예를 들어, `apiVersion: v1`과 `kind: Pod`는 Kubernetes에서 기본적으로 제공하는 Pod 리소스를 나타냅니다.

그러나, 특정 애플리케이션이나 서비스에 특화된 리소스를 정의하고 관리하려면, Kubernetes의 기본 리소스 외에도 Custom Resource를 만들어야 합니다.
이를 위해 Kubernetes는 Custom Resource Definition(CRD)라는 메커니즘을 제공합니다.
CRD를 사용하면 사용자가 직접 정의한 리소스를 Kubernetes 클러스터에 추가할 수 있습니다.
예를 들어, RabbitMQ 클러스터를 관리하기 위한 `RabbitmqCluster`라는 사용자 정의 리소스를 만들 수 있습니다.

```yaml{1-2}
apiVersion: rabbitmq.com/v1beta1
kind: RabbitmqCluster
metadata:
  name: rabbitmq
  namespace: rabbitmq
```

위와 같이 `apiVersion`과 `kind`를 지정하면, Kubernetes는 이를 인식하고 해당 리소스를 관리할 수 있게 됩니다.

## Custom Controller

Custom Resource를 정의만 하면, 실제로 Kubernetes는 이를 관리할 수 없습니다.
정의된 resource의 상태를 모니터링하고, 원하는 상태로 유지하기 위해서는 Custom Controller가 필요합니다.

<iframe style="border: 1px solid rgba(0, 0, 0, 0.1);" width="100%" height="550" src="https://embed.figma.com/board/XYQdgzT4zQEjpNP2IM2FPB/Codedang-Docs?node-id=1580-185&embed-host=share" allowfullscreen></iframe>

Custom Controller는 Kubernetes API 서버와 상호작용하여, Custom Resource의 상태를 지속적으로 감시하고, 정의된 상태(desired state)를 유지하기 위해 필요한 작업을 수행합니다.

RabbitMQ Cluster Operator를 예로 들면, 앞의 예시처럼 `RabbitmqCluster` 리소스를 정의하면, RabbitMQ Operator가 이를 감지하고, RabbitMQ 클러스터를 생성 및 관리합니다.
아래와 같이 pod, service, statefulset 등의 리소스가 자동으로 생성됩니다.

```
❯ kubectl get all -n rabbitmq
NAME                    READY   STATUS    RESTARTS   AGE
pod/rabbitmq-server-0   1/1     Running   0          15d

NAME                     TYPE        CLUSTER-IP      EXTERNAL-IP   PORT(S)                        AGE
service/rabbitmq         ClusterIP   10.43.148.145   <none>        15692/TCP,5672/TCP,15672/TCP   15d
service/rabbitmq-nodes   ClusterIP   None            <none>        4369/TCP,25672/TCP             15d

NAME                               READY   AGE
statefulset.apps/rabbitmq-server   1/1     15d

NAME                                    ALLREPLICASREADY   RECONCILESUCCESS   AGE
rabbitmqcluster.rabbitmq.com/rabbitmq   True               True               15d
```

이를 관리하는 Custom Controller는 rabbitmq-system namespace에 배포되어 있습니다.

```
❯ kubectl get all -n rabbitmq-system
NAME                                               READY   STATUS    RESTARTS   AGE
pod/messaging-topology-operator-67479c576c-8b2lt   1/1     Running   0          15d
pod/rabbitmq-cluster-operator-78bb8bc45c-2fwtp     1/1     Running   0          15d

NAME                      TYPE        CLUSTER-IP     EXTERNAL-IP   PORT(S)   AGE
service/webhook-service   ClusterIP   10.43.143.53   <none>        443/TCP   15d

NAME                                          READY   UP-TO-DATE   AVAILABLE   AGE
deployment.apps/messaging-topology-operator   1/1     1            1           15d
deployment.apps/rabbitmq-cluster-operator     1/1     1            1           15d

NAME                                                     DESIRED   CURRENT   READY   AGE
replicaset.apps/messaging-topology-operator-67479c576c   1         1         1       15d
replicaset.apps/rabbitmq-cluster-operator-78bb8bc45c     1         1         1       15d
```

## Controller vs Operator

Controller와 Operator는 밀접한 관련이 있지만, 약간의 차이가 있습니다.
Controller는 Kubernetes의 기본 개념으로, 정의된 상태를 유지하는 역할의 컴포넌트입니다.
Kubernetes에 내장된 Ingress Controller, Deployment Controller 등 다양한 Controller가 존재합니다.
이외에 앞서 언급한 것처럼 사용자가 직접 Custom Controller를 만들어 Custom Resource를 관리할 수도 있습니다.

반면 Operator는 Custom Resource와 Custom Controller를 함께 묶은 개념입니다.
즉, 특정 애플리케이션이나 서비스에 특화된 리소스를 정의하고, 이를 관리하는 로직을 포함하는 패키지입니다.
Operator는 일반적으로 다음과 같은 구성 요소를 포함합니다.

- **Custom Resource Definition (CRD)**: 관리할 리소스를 정의합니다.
- **Custom Controller**: 정의된 리소스를 감시하고, 원하는 상태를 유지하기 위한 로직을 구현합니다.
