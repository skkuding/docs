# 문제 관리하기

본 Section에서는 문제 관리 기능에 대해서 소개합니다.

Management 페이지의 왼쪽에 있는 `Problem` 버튼을 클릭하면 문제 관리 페이지에 접속할 수 있습니다.

<img width="1714" alt="problem-create" src="https://github.com/user-attachments/assets/05659bc2-46c2-4467-84b3-287ce7bdbe32" />


## 문제 리스트
Problem List에서는 코드당 내의 모든 문제를 확인할 수 있습니다. 

검색과 필터를 사용하여 문제를 찾고, 각 문제의 Visibility를 조정하거나 삭제할 수 있습니다.

### 문제 삭제하기
삭제하려는 문제를 체크박스를 통해 선택하고, 오른쪽 위의 🗑(휴지통) 버튼을 클릭해주세요.

<img width="1714" alt="problem-t" src="https://github.com/user-attachments/assets/2b4e45df-1f63-4454-b4cd-3430f944f32e" />

삭제 재확인 대화 상자가 나타나면, `Delete` 버튼을 클릭하여 문제를 삭제할 수 있어요.

<img width="1714" alt="problem-t" src="https://github.com/user-attachments/assets/11728302-3caf-4dac-a558-85eb978cc179" />


### 문제 공개/비공개 설정
**대회에 속하지 않은** 문제는 사용자측의 Problem List에 공개할 수 있습니다.

문제의 Visible 토글을 활성화하면 문제가 공개되고, 비활성화하면 문제가 비공개되어요.

시작 전 또는 진행 중인 **대회에 포함된 문제는 자동으로 비공개 처리**되며, 공개 여부를 변경할 수 없어요.
단, 끝난 대회에 속한 문제는 공개할 수 있어요.

<img width="1714" alt="problem-t" src="https://github.com/user-attachments/assets/a94e142b-699d-4b50-89c4-f5b4fdc8ffc8" />


### 이 문제가 포함된 대회 보기

문제별로 포함된 대회를 확인할 수 있습니다.

Visible 토글 옆의 `info` 아이콘을 클릭하면,

<img width="1714" height="968" alt="problem-t" src="https://github.com/user-attachments/assets/40c227d0-11a3-4f3e-bffc-3d4838213ebd" />


문제가 포함된 Contest들을 확인할 수 있습니다.

<img width="1714" alt="problem-t" src="https://github.com/user-attachments/assets/226b46ba-2769-423f-8e1c-a8e470a97ed6" />


## 문제 상세 내역

Problem List에서 각 열을 클릭하여 문제 상세 페이지로 이동할 수 있습니다.

문제 상세 페이지에서는 문제 Description 과 **공개 공간에서의 제출 내역**을 확인할 수 있습니다.

### 문제 제출 내역 보기

문제 상세 페이지의 아래 부분에서 **공개 공간에서의 제출 내역**을 확인할 수 있습니다.

제출 내역은 다음과 같은 항목으로 구성됩니다.

1. **`#`** : 제출 번호
2. **`User ID`** : 제출한 User의 ID
3. **`Result`** : 제출 결과. (Accepted, CompileError, WrongAnswer …)
4. **`Language`** : User가 작성한 언어를 나타냄.
5. **`Submission Time`** : User가 제출한 날짜를 나타냄. (`yyyy-mm-dd hh:mm:ss`)
6. **`Code Size`** : User가 제출한 코드의 사이즈를 나타냄. (단위: B)
   
![스크린샷 2025-01-14 오전 3 24 04](https://github.com/user-attachments/assets/8d93ba9d-e9b9-42bf-b24d-f8ebc01b81ef)




### 문제 편집하기

문제 상세 페이지 오른쪽 위의 `Edit` 버튼을 클릭하여 문제를 수정할 수 있습니다.

**모든 항목을 수정할 수 있으며**, 문제를 생성 시와 동일한 조건이 적용됩니다.
![스크린샷 2025-01-14 오전 3 28 17](https://github.com/user-attachments/assets/9b330292-cee2-4389-b579-9cf426fe1f98)

단, **채점 관련 사항**(Testcase 정보, Time/Memory Limit)을 수정하려고 하는데 
**기존 제출이 하나라도 존재하는 경우** 다음과 같은 정책이 적용됩니다.

- 관리자에게 기존 채점의 정확도가 보장되지 않는다는 안내 모달을 띄웁니다. 대회에 포함되어 있던 문제의 경우 대회 배점을 0점으로 만들 것인지 묻습니다.
![스크린샷 2025-01-14 오전 3 33 32](https://github.com/user-attachments/assets/dbcfeaf9-de24-4c4d-b8b3-a78ddb9b8b88)

- 수정 정보가 문제의 Update History에 기록되어 모든 사용자는 문제가 업데이트되었음을 알 수 있습니다. (기능 구현중)




