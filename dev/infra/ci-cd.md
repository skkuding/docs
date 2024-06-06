# CI/CD (GitHub Actions)

CI/CD란 코드를 작성하는 순간부터 서비스에 배포되기까지의 연결된 과정을 말해요.
조금 더 자세한 의미는 아래와 같아요.

- **CI(Continuous Integration)**: 개발자가 작성한 코드를 main 브랜치에 문제 없이 합치도록 돕는 과정을 말해요. Linting이나 formatting, 또는 다양한 testing 등이 해당돼요.
- **CD(Continuous Delivery)**: main 브랜치의 코드를 실제 서비스에 배포하는 과정을 말해요.

조금 더 자세한 설명을 원한다면, 이 [YouTube 영상](https://youtu.be/42UP1fxi2SY)을 확인해보세요!

## Pipeline 구성

코드당의 CI/CD pipeline은 GitHub Actions를 사용해요.
아래 그림처럼 CI, CD(Staging, Production)로 크게 세 개로 이루어져있어요.

<iframe style="border: 1px solid rgba(0, 0, 0, 0.1);" width="100%" height="640" src="https://www.figma.com/embed?embed_host=share&url=https%3A%2F%2Fwww.figma.com%2Fboard%2FT1jlv1pCWwMlMkoritgQVj%2FCodedang-CI%252FCD%3Fnode-id%3D0-1%26t%3DmNYW9T9BVQ94gm4o-1" allowfullscreen></iframe>

- **CI**: Pull Request를 생성하거나 `main` branch에 push했을 때 실행돼요. Linting, formatting, testing 등 여러 과정을 통해 코드가 main branch에 합쳐져도 괜찮은지 검사해요.
- **CD (Staging)**: `main` branch에 push했을 때 실행돼요. 코드를 스테이징 환경에 배포해요.
- **CD (Production)**: 직접 클릭해서 동작시켰을 때 실행돼요. 스테이징 환경의 코드를 실제 서비스에 배포해도 괜찮겠다고 판단하면, 이 pipeline을 실행해서 프로덕션 환경에 배포해요.

> [!INFO]
> 스테이징 환경과 프로덕션 환경의 차이가 궁금하다면 ['Stage Server' 글을 확인해보세요!](/dev/project/stage-server)

## CI

> TODO: 설명 추가 예정

## CD (Staging)

> TODO: 설명 추가 예정

## CD (Production)

> TODO: 설명 추가 예정

## More pipelines

> TODO: 설명 추가 예정
