# Coding Convention

가장 바람직한 것은 formatter와 linter로 스타일을 맞추는 것이에요. 하지만 현실적으로 자동으로 검사하기 어려운 규칙들도 있기 때문에 사람이 직접 지키고 리뷰해야 하는 규칙들이 있어요. 이 문서에 나열된 규칙들을 잘 숙지하고 코드를 작성해주세요.

## Naming

### 중복된 맥락을 피해요.

파일 이름이나 method, 변수 이름을 지을 때 중복된 맥락을 피해주세요.
중복된 맥락은 코드를 읽는 사람에게 불필요한 정보를 제공하고 코드를 길게 만들어요.
예를 들어 파일이나 class 이름에 `User`라는 단어가 들어가면 `User`라는 단어를 변수나 method 이름에 사용하지 않아요.

```typescript
class User {
  getUserInformation() { // [!code --]
  getInformation() { // [!code ++]
    // ...
  }
}
```

### 불필요한 Type을 피해요.

TypeScript는 타입 추론을 지원하기 때문에 변수나 함수의 이름에 타입을 명시할 필요가 없어요. 타입을 명시하는 것은 코드를 길고 복잡하게 만들어요.

```typescript
class User {
  getInformation(): UserInformation { // [!code --]
  getInformation() { // [!code ++]
    // ...
  }
}
```

## REST API

### 영문 소문자와 하이픈(-)을 사용해요.

REST API의 endpoint는 영문 소문자와 하이픈(-)을 사용해주세요. 단, dynamic parameter는 TypeScript에서 변수로 사용하기 때문에 camelCase를 사용해주세요.

```
GET /contest/:contestId/top-participants

```

### 명사형으로 작성해요.

REST API의 endpoint는 API의 대상이 되는 것(What)을 명사형으로 작성해주세요. 어떻게 하는지(How)는 HTTP method로 구분해주세요.(GET, POST, PUT, DELETE)

```
GET /contest/:contestId/top-participants
DELETE /contest/:contestId/participant/:participantId

```
