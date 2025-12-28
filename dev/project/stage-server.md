# Stage Environment

스테이지 환경은 프로덕션 환경과 거의 동일한 설정을 가지며, 새로운 기능이나 변경 사항을 배포 전에 테스트하기 위한 환경이에요.
[stage.codedang.com](https://stage.codedang.com/)에서 확인할 수 있습니다.

`release` 브랜치에 올라간 코드는 자동으로 ArgoCD를 통해 `production` 클러스터에 배포되는 반면,
`main` 브랜치에 올라간 코드는 `stage` 클러스터에 배포돼요.

스테이지 환경은 다음과 같은 구성이 프로덕션 환경과 달라요:

- 클러스터: 별도의 Kubernetes 클러스터 사용
- **객체 저장소**: AWS S3가 아닌 자체 관리 MinIO 사용
- **데이터베이스**: AWS RDS가 아닌 자체 관리 PostgreSQL 사용
- 도메인: `stage` 서브도메인 사용 (예: `stage.codedang.com`)

테스트 환경이라서 데이터 무결성이나 가용성에 대한 요구사항이 낮기 때문에, 객체 저장소와 데이터베이스를 자체 관리형으로 운영하고 있어요.

나머지 구성 요소와 아키텍처는 프로덕션 환경과 동일해요.
자세한 아키텍처는 [아키텍처 문서](./architecture.md)를 참고해주세요.
