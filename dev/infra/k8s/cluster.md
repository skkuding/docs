# Cluster

코드당의 Kubernetes 클러스터는 두 개의 환경(production, stage)으로 구성되어 있습니다.

- **Production**: 제2공학관 4층 서버실 내에 위치한 물리 서버 6대 (5~10번 서버)
- **Stage**: 동아리방에 위치한 물리 서버 3대 (1~3번 서버)

일반적으로 하나의 클러스터로 관리하는 것보다는, 환경별로 클러스터를 분리하는 것이 바람직합니다.

- Stage 환경에서 안전하게 새로운 기능 테스트 가능
- Production 환경의 안정성 보장
- Stage 환경에서 최대한 Production 환경과 유사한 설정 유지 (namespace, resource quota 등)

## k3s

각 환경은 k3s를 이용하여 구성되어 있습니다. 여러 솔루션 중 k3s를 선택한 이유는 다음과 같습니다.

- **Native(kubeadm, kops 등)**: 복잡한 설정과 관리, 높은 리소스 요구사항
- **Managed(GKE, EKS, AKS 등)**: 클라우드 비용 발생 (기본 요금 월 $80 이상)
- **Talos Linux**: Production 환경에 제일 적합하지만, SSH 접근 불가 등 제약사항 존재
- **k3s**: 간편한 설치 및 관리, 다양한 out-of-the-box 기능(Traefik, ServiceLB 등)

### k3s 설치하는 방법

Master node에 설치하는 경우, 다음 명령어를 실행합니다.

```bash
curl -sfL https://get.k3s.io | sh -
```

Worker node에 설치하는 경우, Master node에서 토큰을 확인한 후 다음 명령어를 실행합니다.

```bash
# In master node
sudo cat /var/lib/rancher/k3s/server/node-token

# In worker node
curl -sfL https://get.k3s.io | K3S_URL=https://<MASTER_IP>:6443 K3S_TOKEN=<TOKEN> sh -
```

이후 `kubectl get nodes` 명령어를 통해 노드가 정상적으로 추가되었는지 확인할 수 있습니다.

## Production과 Stage 클러스터의 차이

Production과 stage 환경을 최대한 비슷하게 유지하는 것이 이상적이지만 몇 가지 차이가 있습니다.

### Stage 클러스터에는 PostgreSQL과 MinIO가 구성되어 있습니다.

코드당의 Kubernetes 클러스터의 핵심 원칙 중 하나는 "Stateless"입니다.
On-premise 환경에서는 데이터베이스와 스토리지의 안정성을 보장하기 어렵기 때문에, stateful한 서비스는 AWS 등 외부 서비스로 분리하였습니다.
따라서 production 환경에서는 AWS RDS와 S3를 사용하고 있습니다.

하지만 비용 문제로 인해 stage 환경에서는 AWS 서비스를 사용하기 어려워, stage 클러스터는 PostgreSQL과 MinIO를 포함하고 있습니다.

### Production 클러스터에는 Argo CD가 구성되어 있습니다.

Argo CD는 GitOps 기반의 지속적 배포 도구로, 대부분의 Kubernetes 리소스는 Argo CD를 통해 배포 및 관리되고 있습니다.
스테이지 환경과 프로덕션 환경 각각 다른 Argo CD 인스턴스를 사용하는 것보다는, 하나의 Argo CD 인스턴스를 통해 두 클러스터를 모두 관리하는 것이 대시보드 UI 활용과 설정 관리 측면에서 더 효율적입니다.

Argo CD에 대한 자세한 내용은 [Argo CD 페이지](./argo-cd.md)를 참고해주세요.

### Preview 환경은 Stage 클러스터에 존재합니다.

코드당의 Preview 환경은 stage 클러스터에 존재합니다.
Preview 환경은 각 pull request마다 자동으로 생성되며, merge되면 자동으로 삭제됩니다.
Stage 환경과 유사한 목적과 설정을 가지고 있기 때문에, 별도의 클러스터를 구성하지 않고 stage 클러스터에 포함시켰습니다.
.
