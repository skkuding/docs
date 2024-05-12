# Architecture

코드당은 아래처럼 구성되어 있어요.

<iframe style="border: 1px solid rgba(0, 0, 0, 0.1);" width="100%" height="400" src="https://www.figma.com/embed?embed_host=share&url=https%3A%2F%2Fwww.figma.com%2Ffile%2FXYQdgzT4zQEjpNP2IM2FPB%2FCodedang-Architecture%3Ftype%3Dwhiteboard%26node-id%3D0%253A1%26t%3DGATZX1WwfcJmUJc2-1" allowfullscreen></iframe>

## Frontend

React와 Next.js를 사용하여 구현했어요.
이전에는 Vue.js를 사용했지만, 문제 해결을 쉽게 하고 커뮤니티의 도움을 받기 위해 더 널리 쓰이는 React로 옮겼어요.
Next.js는 SSR(Server Side Rendering)로 SEO(Search Engine Optimization)를 개선하고, 빠른 페이지 로딩을 위해 사용했어요.

스테이지 환경에서는 Vercel을 사용하고, 프로덕션 환경에서는 AWS Amplify를 사용하고 있어요.

## Backend

NestJS를 사용하여 구현했어요.
NestJS는 체계적인 구조로 코드를 구성할 수 있어서 코드의 가독성을 높일 수 있어요.
또한 Node.js의 빠른 속도와 TypeScript의 타입 안정성을 동시에 사용할 수 있어요.

Docker 컨테이너로 배포하고, 프로덕션 환경에서는 AWS ECS를 사용하여 서버를 관리하고 있어요. ECS는 Kubernetes와 비슷한 기능을 제공하지만 더 쉽게 사용할 수 있고, AWS의 다른 서비스와 연동성이 뛰어나요.

## Storage

사진, 동영상 등 여러 파일을 저장하기 위해 저장소를 사용하고 있어요.
스테이지 환경에서는 MinIO, 프로덕션 환경에서는 AWS S3를 사용하고 있어요.

## Database

데이터베이스로 PostgreSQL를 사용하고 있어요.
가장 널리 쓰이는 오픈소스 데이터베이스인 MySQL과 PostgreSQL 중에서 PostgreSQL을 선택한 이유는, PostgreSQL이 더 다양한 기능을 제공하고 다양한 형식을 호환하기 때문이에요.

프로덕션 환경에서는 AWS RDS를 사용하고 있어요.

## Cache

캐시 서버로 Redis를 사용하고 있어요.
Redis는 메모리 기반의 키-값 저장소로, 빠른 속도와 다양한 기능을 제공하기 때문에 캐시 서버로 많이 사용되고 있어요.
코드당에서는 캐시 뿐만 아니라 토큰, 이메일 인증 등 여러 임시 데이터를 저장하기 위해 사용하고 있어요.

## Message Queue

Message queue는 두 서버 간의 비동기 통신을 위해 많이 사용되고 있어요.
특히 MSA(Microservice Architecture)에서는 서비스 간의 결합도를 낮추기 위해 많이 사용되고 있어요.

Backend와 Iris 서버 간에 직접 HTTP로 통신한다면 여러 개의 Iris 서버 중 어느 서버로 요청을 보내야 하는지 결정하는 로드 밸런싱 로직이 필요하고, 서버가 많아질수록 이 로직이 복잡해질 수 있어요.
Backend 서버에서는 Iris 서버 각각이 채점 가능한 상태인지와 죽어있지 않은지를 알아야 하고, 이는 backend와 Iris 사이의 결합도를 높일 수 있어요.

하지만 message queue를 사용하면 backend 서버는 Iris 서버의 상태를 알 필요가 없고, message queue에 메시지를 보내기만 하면 돼요.
여러 대의 Iris 서버 중 하나가 message queue에서 메시지를 꺼내 처리하면 되기 때문에 Iris 서버 간의 로드 밸런싱도 쉽게 할 수 있어요.

Message queue로는 RabbitMQ를 사용하고 있어요. RabbitMQ는 널리 쓰이는 Kafka에 비해 기능은 적지만 가볍고 쉽게 사용할 수 있어요.

## Iris

Iris는 Go 언어로 짜여진 코드 채점 서버예요.
Message queue를 통해 채점 요청을 받아 코드를 컴파일하고, S3 저장소에서 테스트케이스를 불러오며, sandbox에서 실행한 뒤 결과를 반환해요.

## Testcase Storage

테스트케이스 저장소는 스테이지 환경에서는 MinIO, 프로덕션 환경에서는 AWS S3를 사용하고 있어요.

## Sandbox

Sandbox는 C 언어로 짜여진 코드 실행 프로그램이예요.
Iris 서버 내부에 위치하며, 코드 실행을 담당해요.
[QingdaoU의 Judger](https://github.com/qingdaou/judger)를 기반으로 하며, seccomp 시스템 콜을 통해 코드 실행 환경을 격리해요.
