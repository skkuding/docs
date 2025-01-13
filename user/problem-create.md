# 문제 생성하기

본 Section에서는 문제 생성 기능에 대해서 소개합니다.

코드당에서는 문제를 직접 만들 수도 있고, 엑셀 파일로 여러 개의 문제를 한번에 올릴 수도 있어요. 

두 방법을 아래에서 자세히 소개할게요.

## 문제 직접 만들기
![image](https://github.com/user-attachments/assets/56c49c76-cbbf-4916-8acb-0172242d4637)

Management 페이지에서 좌측 Problem 버튼을 클릭하면 Problem 페이지에 접속할 수 있어요.

여기서  <code>+ Create</code>  버튼을 클릭하여 문제 생성 페이지에 진입할 수 있어요. 


### 문제 기본 정보 작성

먼저, 문제에 대한 기본 정보를 작성해주세요. ( * : 필수 필드)

![image](https://github.com/user-attachments/assets/09380b6d-00df-4de5-9b1f-14943c227ae3)

1. **`Title`** * : 문제의 이름을 입력해요. 최대 200자까지 입력할 수 있어요.
   
2. **`Visible`** * : 코드당의 Problem 탭에 문제를 노출할지 말지 결정해요. Visible이 True이면 문제가 모두에게 공개되어요.
3. **`Info`** : Language와 Level로 이루어져 있어요.
   - `Language` * : 사용자가 풀 수 있는 언어를 선택해요. 현재 C, C++, Python3, Java를 지원하고, 다중 선택이 가능해요.
   - `Level` * : 문제의 난이도를 설정해요. Level 1~5 중에 선택해주세요.
4. **`Description` * : 문제에 대한 정보를 작성해주세요. 수식, 사진 첨부를 지원해요. 
5. **`Input Description` * : Testcase Input에 대한 정보를 입력해주세요. 예를 들어, `첫째 줄에 A와 B가 주어진다. (0 < A, B < 10)`와 같이 작성할 수 있습니다.
6. **`Output Description` * : Testcase Output에 대한 정보를 입력해주세요. 예를 들어, `첫째 줄에 A+B를 출력한다.`와 같이 작성할 수 있습니다.





### 문제 Testcase 정보 작성 *

다음으로 채점에 사용될 Testcase를 설정해주세요.

![image](https://github.com/user-attachments/assets/4cb35dc4-21d7-436d-a6ac-90d1c3f28146)

문제의 Testcase는 Sample Testcase 또는 Hidden Testcase로 설정할 수 있어요.

모든 Testcase는 채점에 사용되고 **채점 결과가 공개**되지만, 
Sample Testcase의 Input/Output은 사용자에게 공개되고 Hidden Testcase는 공개되지 않아요.

(대회에 속한 문제의 경우 채점 결과를 비공개할 수 있어요. 자세한 것은 대회 생성하기 섹션을 참고해주세요.)

모든 Testcase 배점의 합은 100%가 되어야해요. 각 배점을 직접 설정하거나 `Equal Distribution` 버튼을 통해 일괄적으로 배점을 설정할 수 있어요.

Testcase 정책을 정리하면 다음과 같아요.
| | Input/Output 노출 여부	| Test 버튼 클릭 시	| Submit 버튼 클릭 시 |
| --| -- | -- | -- |
| Sample Testcase |	노출됨	| 채점됨 + 채점 결과 노출	| 채점됨 + 대회 생성 시 채점 결과 노출 여부 결정
| Hidden Testcase	| 노출되지 않음	| 채점하지 않음	| 채점됨 + 대회 생성 시 채점 결과 노출 여부 결정
| User Testcase  	| 사용자가 추가	| 채점됨 + 채점 결과 노출	| 채점되지 않음


### 문제 기타 정보 작성
마지막으로 필요한 경우 언어별 `Template`, `Hint`, `Source`를 작성할 수 있어요.

![image](https://github.com/user-attachments/assets/8dddcc61-d187-4ed8-af24-f3379bcd4f82)

사용자가 처음 문제를 풀러 들어가면 보여지는 기본 `Template`을 설정할 수 있어요. 언어별로 다르게 설정할 수 있어요.

`Hint`는 문제를 풀 때 도움이 되는 힌트를 제공할 수 있어요. 사용자 페이지에서 사용자는 토글을 눌러서 힌트를 열 수 있어요.

`Source`는 문제의 원본 소스를 말해요. 대회 출처나 저작권자를 작성할 수 있어요.


마지막으로 Submit 버튼을 누르면 문제 생성이 완료되어요.

## 문제 업로드 하기

여러 개의 문제를 한번에 올리는 경우에는 문제 정보를 업로드해서 문제를 생성할 수 있어요.

![image](https://github.com/user-attachments/assets/933e17e4-be42-4c17-9bba-387d207c2faf)

Problem 페이지에서 여기서 `Upload` 버튼을 클릭하면 문제 업로드 모달이 나오게 되어요.

Sample Excel 파일을 다운로드 받아 문제 정보를 모두 수정한 뒤에, 파일을 업로드해주세요.

예를 들어 Sample Excel 파일을 그대로 업로드하면,
![image](https://github.com/user-attachments/assets/006b1533-db0a-442a-ba95-9d7538081b45)

다음과 같이 두 문제가 생성되게 됩니다.
![image](https://github.com/user-attachments/assets/b64bbfe5-7731-4b77-9c46-d670ca4768b6)


