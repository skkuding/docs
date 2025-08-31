# Kubernetes Architecture

코드당 production 환경의 Kubernetes 아키텍처는 다음과 같습니다.

<iframe style="border: 1px solid rgba(0, 0, 0, 0.1);" width="100%" height="650" src="https://embed.figma.com/board/XYQdgzT4zQEjpNP2IM2FPB/Codedang-Docs?node-id=889-65&embed-host=share" allowfullscreen></iframe>

## Stage

대부분의 구성은 production 환경과 동일하지만, stage 환경에는 PostgreSQL과 MinIO가 포함되어 있습니다.

<iframe style="border: 1px solid rgba(0, 0, 0, 0.1);" width="100%" height="600" src="https://embed.figma.com/board/XYQdgzT4zQEjpNP2IM2FPB/Codedang-Docs?node-id=890-356&embed-host=share" allowfullscreen></iframe>
