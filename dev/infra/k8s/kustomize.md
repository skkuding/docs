# Kustomize

코드당에서 많은 서비스들은 Production과 Stage 환경에 배포되고 있습니다. 이 때 각 환경에 맞는 설정이 일부 다르기 때문에, 이를 효율적으로 관리하기 위해 Kustomize를 사용하고 있습니다. Kustomize를 사용하는 서비스의 파일 구조는 다음과 같습니다.

```
<service-name>/
  ├── base/
  │   ├── <manifest-1>.yaml
  │   ├── <manifest-2>.yaml
  │   ├── ...
  │   └── kustomization.yaml
  └── overlays/
      ├── production/
      │   ├── <patch-1>.yaml
      │   ├── <patch-2>.yaml
      │   ├── ...
      │   └── kustomization.yaml
      └── stage/
          ├── <patch-1>.yaml
          ├── <patch-2>.yaml
          ├── ...
          └── kustomization.yaml
```

- `base/`: 공통 설정입니다. 모든 환경에서 동일하게 적용되는 Kubernetes manifest 파일들이 있습니다.
- `overlays/`: 환경별 설정입니다. 각 환경(production, stage 등)에 맞는 패치 파일들이 있습니다.
- `kustomization.yaml`: Kustomize 설정 파일입니다. base와 overlays를 정의하고, 필요한 리소스와 패치를 지정합니다.

## Kustomization 파일 예시

Base의 `kustomization.yaml` 파일 예시는 다음과 같습니다.

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
namespace: <namespace>

resources:
  - <manifest-1>.yaml
  - <manifest-2>.yaml
  - ...

commonAnnotations:
  managed-by: kustomize
```

- `resources`: 이 base에서 관리하는 Kubernetes manifest 파일들을 나열합니다.
- `commonAnnotations`: 모든 리소스에 공통으로 적용할 annotation을 지정합니다.

Overlays의 `kustomization.yaml` 파일 예시는 다음과 같습니다.

```yaml
apiVersion: kustomize.config.k8s.io/v1beta1
kind: Kustomization
namespace: <namespace>

resources:
  - ../../base

patches:
  - path: <patch-1>.yaml
    target:
      kind: <resource-kind>
      name: <name>
  - path: <patch-2>.yaml
    target:
      kind: <resource-kind>
      name: <name>
```

- `resources`: 이 overlays에서 참조하는 base 경로를 지정합니다. 새로운 리소스를 추가할 수도 있습니다.
- `patches`: 이 overlays에서 적용할 패치 파일들을 지정합니다. 각 패치는 이미 base에 정의된 리소스에 대해 적용됩니다.

Kustomization 파일에 대한 자세한 내용은 [Kustomize 공식 문서](https://kubectl.docs.kubernetes.io/references/kustomize/kustomization/)를 참고해주세요.

## kubectl 명령어로 Kustomize 사용하기

Kustomize는 kubectl에 내장되어 있어, 별도의 설치 없이도 사용할 수 있습니다. Kustomize를 사용하여 Kubernetes 리소스를 생성하거나 적용하려면 다음 명령어를 사용합니다.

```bash
# Diff 확인 (적용 전 변경사항 확인)
kubectl diff -k <directory-to-kustomization>

# 리소스 생성
kubectl apply -k <directory-to-kustomization>

# 리소스 삭제
kubectl delete -k <directory-to-kustomization>
```

## Helm vs Kustomize

Kustomize와 Helm은 모두 Kubernetes 리소스를 관리하는 도구이지만, 접근 방식과 사용 사례가 다릅니다.

- **Helm**: 패키지 매니저로서, 'Chart'라는 패키지 단위로 애플리케이션을 배포합니다. 복잡한 애플리케이션이나 여러 종속성을 가진 애플리케이션에 적합합니다. 템플릿 기반으로 동작하여, 변수와 조건문을 사용해 유연한 구성이 가능합니다.
- **Kustomize**: 기존의 YAML 파일을 기반으로 patch와 overlay를 적용합니다. 단순한 애플리케이션이나 환경별 설정이 필요한 경우에 적합합니다. 템플릿이 없고, YAML 파일을 직접 수정하는 방식으로 동작합니다.

특별한 template 기능이 필요하거나 복잡한 애플리케이션을 관리하는 경우 Helm을 사용하는 것이 좋을 수 있지만, 일반적인 경우 Kustomize가 더 간단하고 직관적인 도구로 알려져 있습니다.
특히 Helm의 주요 목적은 수많은 사용자에게 배포하는 패키지 매니저이기 때문에, 코드당처럼 내부적으로 관리하는 프로젝트에서는 Kustomize가 더 적합합니다.
