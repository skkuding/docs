# Helm Charts

쿠버네티스 애플리케이션을 정의, 설치 및 업그레이드하기 위한 **패키지 매니저**입니다. Helm Charts를 사용하면 복잡한 애플리케이션을 쉽게 배포하고 관리할 수 있습니다. Javascript의 `npm`이나 Python에서 `pip`와 유사한 역할을 합니다.
코드당에서 직접 구현해서 사용하지는 않지만 Redis, Grafana, Prometheus 등 여러 서비스에서 Helm Chart를 제공하고 있습니다.

## Helm Charts의 구성 요소

<iframe style="border: 1px solid rgba(0, 0, 0, 0.1);" width="100%" height="400" src="https://embed.figma.com/board/XYQdgzT4zQEjpNP2IM2FPB/Codedang-Docs?node-id=2499-1113&embed-host=share" allowfullscreen></iframe>

Helm Chart는 다음과 같은 주요 구성 요소로 이루어져 있습니다:

- **Chart.yaml**: 차트의 메타데이터(이름, 버전, 설명 등)를 포함하는 파일입니다.
- **values.yaml**: 차트의 기본 설정 값을 정의하는 파일입니다. 사용자는 이 파일을 수정하여 배포 시 설정을 커스터마이징할 수 있습니다.
- **templates/**: 쿠버네티스 리소스 정의 파일들이 위치하는 디렉토리입니다. 이 파일들은 Go 템플릿 문법을 사용하여 동적으로 값을 삽입할 수 있습니다.
- **charts/**: 차트가 의존하는 다른 차트들이 위치하는 디렉토리입니다.
- **README.md**: 차트에 대한 설명과 사용법을 제공하는 문서 파일입니다.

코드당에서는 주로 `values.yaml`을 수정하여 각 서비스의 설정을 커스터마이징하고 있습니다. 이외의 파일들은 Helm Chart 제공자가 미리 정의한 내용을 사용합니다.

## Values 파일 커스터마이징

Helm Chart를 배포할 때, `values.yaml` 파일을 수정하여 애플리케이션의 설정 값을 커스터마이징할 수 있습니다. 예를 들어, Grafana Helm Chart를 사용할 때, Artifact Hub에서 제공하는 [기본 values.yaml](https://artifacthub.io/packages/helm/grafana/grafana?modal=values)을 참고하여 필요한 설정을 변경할 수 있습니다.

하지만 설정하지 않은 값들은 기본값이 적용되므로 모든 설정 값을 다룰 필요는 없으며, 필요한 부분만 선택적으로 수정하면 됩니다. 예를 들어 레플리카 수만 변경하고 싶다면 다음과 같이 설정할 수 있습니다:

```yaml
replicas: 3
```

## Release 관리

Helm Chart를 사용하여 애플리케이션을 배포하면, 이를 **Release**라고 부릅니다. 각 Release는 특정 차트 버전과 설정 값을 기반으로 생성됩니다. Helm은 Release의 설치, 업그레이드, 롤백 등을 관리할 수 있는 기능을 제공합니다.

```bash
helm repo add grafana https://grafana.github.io/helm-charts
helm install my-grafana grafana/grafana -f values.yaml
```

위 명령어는 `grafana` 레포지토리의 `grafana` 차트를 사용하여 `my-grafana`라는 이름의 Release를 생성하고, `values.yaml` 파일의 설정 값을 적용하여 Grafana를 배포합니다.

이 때 위에서 언급한 대로 `values.yaml` 파일에서 설정하지 않은 값들은 Helm Chart의 기본값이 적용됩니다.

## Release 업그레이드 및 롤백

Helm은 Release의 업그레이드와 롤백 기능을 제공합니다. 새로운 버전의 차트가 출시되거나 설정 값을 변경해야 할 때, Helm을 사용하여 쉽게 업그레이드할 수 있습니다. 또한, 문제가 발생할 경우 ConfigMap에 저장된 정보를 바탕으로 이전 버전으로 롤백할 수도 있습니다.

```bash
helm upgrade my-grafana grafana/grafana -f values.yaml
helm rollback my-grafana 1
```

## Operator vs Helm Charts

Helm Charts와 Operator 패턴은 모두 쿠버네티스에서 애플리케이션을 배포하고 관리하는 데 사용되지만, 접근 방식과 기능 면에서 차이가 있습니다.

- **Helm Charts**: 주로 애플리케이션의 **배포와 업그레이드**에 중점을 둡니다. 사용자는 `values.yaml` 파일을 통해 설정 값을 커스터마이징하고, Helm 명령어를 사용하여 배포 및 관리를 수행합니다. Helm은 선언적 방식으로 리소스를 생성하고 관리합니다.
- **Operator**: 애플리케이션의 **전체 수명 주기를 관리**하는 데 중점을 둡니다. Operator는 Custom Resource Definition(CRD)과 Custom Controller를 사용하여 애플리케이션의 상태를 지속적으로 모니터링하고, 정의된 상태(desired state)를 유지하기 위해 자동으로 작업을 수행합니다. Operator는 복잡한 운영 작업을 자동화하는 데 적합합니다.

결론적으로, Helm Charts는 배포와 업그레이드에 적합하며, Operator는 애플리케이션의 전체 수명 주기 관리에 적합합니다. 코드당에서는 서비스 특성에 따라 Helm Charts와 Operator를 적절히 활용하고 있습니다.
