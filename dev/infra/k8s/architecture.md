# Kubernetes Architecture

코드당 production 환경의 Kubernetes 아키텍처는 다음과 같습니다.

<iframe style="border: 1px solid rgba(0, 0, 0, 0.1);" width="100%" height="650" src="https://embed.figma.com/board/XYQdgzT4zQEjpNP2IM2FPB/Codedang-Docs?node-id=889-65&embed-host=share" allowfullscreen></iframe>

### Route53

도메인 관리는 AWS Route53을 사용하고 있습니다.
도메인 record들은 쿠버네티스 클러스터의 Node(동아리 서버) IP로 연결되어 있습니다.

각 DNS record는 Terraform으로 관리되고 있습니다. 예를 들어 `codedang.com` 도메인은 다음과 같이 정의되어 있습니다.

```terraform
resource "aws_route53_record" "codedang" {
  name    = "codedang.com"
  zone_id = data.aws_route53_zone.codedang.zone_id  # Route53 Hosted Zone of 'codedang.com'
  type    = "A"
  records = local.prod_cluster_ip # IP addresses of the Kubernetes nodes
  ttl     = 300
}
```

### Ingress

클러스터 내부로 들어오는 트래픽은 Traefik Ingress Controller가 관리하고 있습니다.

자세한 내용은 [Ingress 페이지](./ingress.md)를 참고해주세요.

### Deployment & ReplicaSet & Pod

각 애플리케이션은 Deployment로 관리되고 있으며, 각 Deployment는 ReplicaSet과 Pod로 구성되어 있습니다.

- Deployment: 애플리케이션이 배포될 방식을 정의합니다. (이미지, 환경 변수, 볼륨 등)
- ReplicaSet: 지정된 수의 Pod가 항상 실행되도록 보장합니다.
- Pod: 컨테이너의 묶음으로, 실제 애플리케이션이 실행되는 단위입니다. (보통 하나의 컨테이너로 구성됩니다)

실제 YAML manifest는 Deployment만 작성하지만, ReplicaSet과 Pod는 Deployment에 의해 자동으로 생성되고 관리됩니다.

> **참고: [Kubernetes 공식 문서 "Best Practices"](https://kubernetes.io/docs/concepts/configuration/overview/#naked-pods-vs-replicasets-deployments-and-jobs)**
>
> Don't use naked Pods (that is, Pods not bound to a ReplicaSet or Deployment) if you can avoid it. Naked Pods will not be rescheduled in the event of a node failure.

### RabbitMQ Operator

RabbitMQ는 메시지 큐로 사용되고 있으며, RabbitMQ Operator를 통해 관리되고 있습니다. RabbitMQ Operator는 두 가지 Operator로 구성되어 있습니다.

- **RabbitMQ Cluster Operator**: RabbitMQ 클러스터의 생성, 업데이트, 삭제를 관리합니다. (Resource: `RabbitmqCluster`)
- **RabbitMQ Messaging Topology Operator**: RabbitMQ의 user, permission, queue, exchange 등을 관리합니다. (Resource: `User`, `Permission`, `Queue`, `Exchange`, `Binding` 등)

즉, Cluster Operator는 RabbitMQ 클러스터 자체를 관리하고, Messaging Topology Operator는 RabbitMQ 클러스터 내부의 리소스를 관리합니다.

자세한 내용은 [RabbitMQ Operator 공식 문서](https://www.rabbitmq.com/kubernetes/operator/operator-overview)를 참고해주세요.

### Redis Operator

Redis는 캐시 서버로 사용되고 있으며, Redis Operator를 통해 관리되고 있습니다. Redis 공식 Operator인 'Redis Enterprise Operator'는 많은 기능을 유료로 제공하기 때문에, 오픈소스인 'Redis Operator by Opstree'를 사용하고 있습니다.

Redis 설치는 Helm chart를 사용하며, 현재 코드당은 캐시 목적으로만 사용하기 때문에 'standalone' 모드로 설치되어 있습니다.

자세한 내용은 [Redis Operator 공식 문서](https://redis-operator.opstree.dev/docs/getting-started/)를 참고해주세요.

## Stage

대부분의 구성은 production 환경과 동일하지만, stage 환경에는 PostgreSQL과 MinIO가 포함되어 있습니다.

<iframe style="border: 1px solid rgba(0, 0, 0, 0.1);" width="100%" height="600" src="https://embed.figma.com/board/XYQdgzT4zQEjpNP2IM2FPB/Codedang-Docs?node-id=890-356&embed-host=share" allowfullscreen></iframe>

### MinIO Operator

MinIO는 S3 호환 오브젝트 스토리지로 사용되고 있으며, MinIO Operator를 통해 관리되고 있습니다. MinIO Operator에서는 'Tenant'라는 리소스를 통해 MinIO 클러스터를 생성하고 관리합니다. Stage 환경에서는 단순한 테스트 용도로만 사용하기 때문에, single pod으로 구성된 standalone mode로 배포하고 있습니다.

공식 문서는 유료 라이선스를 기준으로 작성되어 있어, 자세한 내용은 [MinIO Operator GitHub의 examples](https://github.com/minio/operator/blob/master/examples/kustomization/base/tenant.yaml)를 참고해주세요.

### PostgreSQL

다른 stateful 서비스와 마찬가지로 PostgreSQL도 Operator 도입을 고려했지만, 대표적인 PostgreSQL Operator인 'CloudNativePG'의 복잡한 설정 때문에 간단한 single pod으로 배포하고 있습니다.
