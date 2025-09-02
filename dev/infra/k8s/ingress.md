# Ingress

Ingress는 Kubernetes의 핵심 resource 중 하나로, 외부에서 클러스터 내부의 서비스로 HTTP 및 HTTPS 트래픽을 라우팅하는 역할을 합니다.
Ingress는 domain-based routing, TLS termination, load balancing 등 다양한 기능을 제공합니다.

<iframe style="border: 1px solid rgba(0, 0, 0, 0.1);" width="100%" height="550" src="https://embed.figma.com/board/XYQdgzT4zQEjpNP2IM2FPB/Codedang-Docs?node-id=1309-321&embed-host=share" allowfullscreen></iframe>

Kubernetes에서 Ingress를 사용하려면 Ingress Controller가 필요합니다.
Ingress Controller는 정의된 Ingress 리소스를 읽어들여 실제로 트래픽을 라우팅하는 역할을 합니다.
코드당은 Traefik Ingress Controller를 사용하고 있습니다.
Traefik의 장점은 다음과 같습니다.

- 설정이 간단하고 사용하기 쉽습니다.
- 다양한 기능을 제공하며, 확장성이 뛰어납니다.
- Kubernetes와 잘 통합되어 있고, k3s에 기본으로 포함되어 있습니다.

## Issuing a TLS certificate

HTTPS를 사용하기 위해서는 도메인 별로 TLS 인증서를 발급받아야 합니다.
코드당에서는 cert-manager를 사용하여 Let's Encrypt로부터 TLS 인증서를 자동으로 발급받고 갱신하고 있습니다.

### cert-manager

cert-manager는 Kubernetes에서 TLS 인증서를 자동으로 관리하는 오픈소스 프로젝트입니다.
cert-manager는 다양한 CA(Certificate Authority)를 지원하고, 자동 인증서 갱신 기능을 제공합니다.

### ClusterIssuer

ClusterIssuer는 cert-manager에서 제공하는 리소스로, namespace 상관 없이 클러스터 전체에서 사용할 수 있습니다.
코드당에서는 Let's Encrypt에서 TLS 인증서를 발급받으며, 클러스터 별로 두 개의 ClusterIssuer를 구성하고 있습니다.

- `letsencrypt`: http01 challenge를 사용하는 ClusterIssuer로, 대부분의 Ingress에서 사용됩니다.
- `letsencrypt-dns01`: dns01 challenge를 사용하는 ClusterIssuer로, 와일드카드 도메인에 대해 TLS 인증서를 발급받을 때 사용됩니다. (예: `*.preview.codedang.com`)

TLS 인증서를 발급 받기 위한 challenge 방식은 크게 http01과 dns01 두 가지가 있습니다.

- http01 challenge: Ingress에 특정 경로로(예: `<DOMAIN>/.well-known/acme-challenge/<SECRET-VALUE>`) 접근하여 도메인 소유권을 검증합니다.
- dns01 challenge: 도메인의 DNS 설정에 특정 TXT 레코드를 추가하여 도메인 소유권을 검증합니다. Route53 등에 접근 권한이 필요합니다.

Ingress 리소스에서 `cert-manager.io/cluster-issuer` annotation을 사용하여 ClusterIssuer를 지정할 수 있습니다.

```yaml{5-6,9-12}
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: example-ingress
  annotations:
    cert-manager.io/cluster-issuer: letsencrypt
spec:
  ingressClassName: traefik
  tls:
    - hosts:
        - example.codedang.com
      secretName: example-tls
  rules:
    - host: example.codedang.com
      http:
        paths:
          ...
```

예를 들어, 위와 같이 annotation을 설정하면 `letsencrypt` ClusterIssuer를 사용하여 `example.codedang.com` 도메인에 대한 TLS 인증서를 발급받습니다.
Wildcard 도메인은 dns01 challenge가 필요하기 때문에, `letsencrypt-dns01` ClusterIssuer를 사용해야 합니다.

`.spec.tls` 필드에서는 발급받은 TLS 인증서를 저장할 Secret의 이름을 지정합니다.
같은 namespace 내에서 같은 이름의 secret이 존재하면 재사용되고, 존재하지 않으면 ClusterIssuer가 TLS 인증서를 발급받아 자동으로 생성합니다.
만약 같은 도메인에 대해 여러 Ingress가 존재한다면, 같은 secret 이름을 사용하여 인증서를 공유하는 것이 좋습니다.

## Assigning a DNS record

Ingress 리소스를 생성하기 전에, 도메인에 대한 DNS record를 설정해야 합니다.
코드당에서는 AWS Route53을 사용하고 있으며, 각 도메인의 A 레코드는 클러스터의 Node IP로 설정되어 있습니다.

Route53 record는 Terraform으로 관리되고 있기 때문에 새로운 record를 추가하거나 수정할 때는 Terraform 코드를 업데이트한 후 `terraform apply` 명령어를 실행해야 합니다.
예를 들어, `codedang.com` 도메인의 A 레코드는 다음과 같이 정의되어 있습니다.

```terraform
resource "aws_route53_record" "codedang" {
  name    = "codedang.com"
  zone_id = data.aws_route53_zone.codedang.zone_id  # Route53 Hosted Zone of 'codedang.com'
  type    = "A"
  records = local.prod_cluster_ip # IP addresses of the Kubernetes nodes
  ttl     = 300
}
```
