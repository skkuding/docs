# 강의 관리하기

본 Section에서는 강의를 관리하는 방법에 대해서 소개합니다.   
강의 관리 및 삭제는 Instructor 권한을 가진 사용자만 가능합니다.    

---

## 강의 관리 화면 접근하기


### Management
강의 개설, 문제 출제 등의 모든 관리는 Management 페이지에서 가능해요.   
로그인 후, 화면 상단 우측에 있는 내 ID를 클릭하면 Management 페이지로 이동할 수 있는 메뉴가 나와요.   
<img width="1368" height="874" alt="image" src="https://github.com/user-attachments/assets/20c18e63-896a-47c2-a0c0-286dd06da3eb" />    


### Course List
기본적으로 강의는 Management 페이지의 Course 메뉴에서 관리할 수 있어요.   
이 페이지에서는 내가 직접 개설한 강의 또는 Instructor 권한을 가지고 있는 강의만 보여요.   
<img width="1893" height="872" alt="image" src="https://github.com/user-attachments/assets/71464d86-00ee-45ce-ac39-b0df9d76be60" />  
  

강의 이름을 클릭하면 해당 강의의 참여자와 과제를 관리할 수 있어요.  
각 메뉴에 들어가서 자세히 살펴보아요.

---

## 강의 참여자 수정하기(Member)

강의에 참여 중인 계정들의 리스트를 확인할 수 있어요.  
<img width="1889" height="870" alt="image" src="https://github.com/user-attachments/assets/69b65acf-74e9-46c3-bc6b-e4bacecb6ff7" />



### 참여자 추가
`Invite` 버튼을 클릭하면 새 계정을 추가할 수 있어요.  
<img width="1892" height="874" alt="image" src="https://github.com/user-attachments/assets/814d2c98-b67e-40c1-b812-2a09fb91b199" />  

새 계정을 추가하는 방법은 두 가지가 있어요: 

**1. Invite by Invitation Code**: 초대 코드를 이용하는 방법이에요.  
<img width="701" height="381" alt="image" src="https://github.com/user-attachments/assets/b8ea5ec6-1288-4c7d-a500-0ca4bc35c9f6" />

 - 스위치를 켜면 6자리의 초대 코드가 생성돼요.  
 - 초대하고자 하는 사용자가 Course 페이지의 `Register`  버튼을 눌러 해당 코드를 입력하면 강의에 참여할 수 있어요.  
 - 이때, 승인된 계정만 허용하도록 선택할 수 있어요.  
 - 현재 코드당은 `skku.edu`를 사용하는 이메일을 기준으로 하고 있지만, 화이트리스트를 업로드하여 다른 기준을 적용할 수도 있어요.


**2. Invite Manually**: 사용자를 수동으로 추가하는 방법이에요.  
<img width="708" height="282" alt="image" src="https://github.com/user-attachments/assets/b09c299e-a322-42ec-b37d-21ef13490c53" />  

 - 초대하고자 하는 계정의 이메일을 검색한 후 `Invite` 버튼을 누르면 해당 사용자를 추가할 수 있어요.  
 - 검색 창 오른쪽에서 해당 계정의 계층을 설정하면, 더 빠르게 사용자를 찾을 수 있어요.


### 권한 변경  
<img width="1430" height="871" alt="image" src="https://github.com/user-attachments/assets/5be5e73d-da1f-42c4-a594-6b17f9b88759" />  

각 계정의 Role을 클릭하면 해당 계정의 권한을 수정할 수 있어요.  
단, Instructor는 자신의 권한을 student로 변경할 수 없어요.  


### 참여자 삭제
<img width="1423" height="859" alt="image" src="https://github.com/user-attachments/assets/81764680-1314-4657-bfc1-710168c8c3e9" />

참여자 리스트 왼쪽에 체크박스가 있어요.  
삭제하고자 하는 참여자를 모두 선택한 후, `삭제` 버튼을 누르면 해당 사용자를 강의 참여자 명단에서 삭제할 수 있어요.


---

## 과제 관리하기(Assignment)

강의에 사용되는 과제를 관리할 수 있어요.
<img width="1906" height="874" alt="image" src="https://github.com/user-attachments/assets/88393343-cb51-45ac-9a71-bf851d457b80" />


먼저 새로운 과제를 생성하는 방법에 대해 알아볼게요.  
`+ Create` 버튼을 클릭하면 과제 생성 페이지로 이동해요.  


### 과제 생성
<img width="936" height="725" alt="image" src="https://github.com/user-attachments/assets/9b58d4b4-fa79-4c24-b8d1-d68e6c8d65ee" />  

이제부터 입력 항목에 대해 알아볼게요. (*은 필수 항목이에요.)  

 1. **Title** *: 과제의 제목을 입력해요.  
    - 120자까지 입력할 수 있어요.

 2. **Week** *: 과제를 몇 주차에 노출할지 선택해요.
    
 3. **Start Time** *: 과제가 학생들에게 공개되는 일시를 설정해요.
    
 4. **Due Time**: 과제의 제출 마감 기한을 설정해요. 마감 기한이 지나도 과제를 계속 열람할 수 있어요.
    
 5. **End Time**: 과제의 종료 일시를 설정해요. 종료 일시가 지나면 과제를 더 이상 열람할 수 없어요.
    
 6. **Description**: 과제에 대한 설명을 입력해요.  
     - 이미지, 30MB 이하의 파일, 표 등을 첨부할 수 있어요.
       
 7. **Problem List** *: `Import problem` 버튼을 클릭해 과제에 이용할 문제(Problem)를 불러올 수 있어요.  
<img width="1894" height="874" alt="image" src="https://github.com/user-attachments/assets/6816e416-b98e-4e0f-843e-98f327e29783" />  

     - 현재는 코드당에서 생성된 문제만 불러올 수 있어요. 코드당에서 문제를 생성하는 방법을 알아보려면 [여기](https://docs.codedang.com/user/problem-create-250810.html)를 클릭해주세요!  
     - 불러올 문제를 모두 선택한 후 `Import` 버튼을 클릭하면 문제가 추가돼요.  
     - 과제를 생성하면 해당 문제는 더 이상 Problem에서 볼 수 없으니 주의해 주세요.  
 <img width="938" height="294" alt="image" src="https://github.com/user-attachments/assets/41406ebf-fbd7-4caf-9868-ca007b4ed66f" />  

     - 문제를 다 추가했다면, 각 문제의 총점과 배열 순서를 정할 수 있어요.  
     - 해당 문제가 포함된 다른 과제를 보려면 상세 버튼을 클릭해주세요.
       
  8. **Solution**: 해답이 있는 문제의 경우, 공개 여부를 선택할 수 있어요.  
     (문제 생성 또는 수정 페이지에서 해답을 추가할 수 있어요!)
     
  9. 마지막으로 **히든 테스트케이스 결과 공개 여부**, **복사/붙여넣기 허용 여부**를 선택해요.  

이제 과제를 생성할 준비를 모두 마쳤어요.  
`Create` 버튼을 누르면 Assignment List에서 내 과제를 볼 수 있어요!😃


### 개별 과제 보기
Assignment List에서 과제를 클릭하면 해당 과제의 정보를 열람하거나 수정할 수 있어요.  
과제 상세 페이지에는 진행 상태, Start time, End time, 그리고 Due time이 나타나 있어요.  
`Edit` 버튼을 클릭하면 과제 수정 페이지로 이동해요.  
과제의 수정 과정은 과제 생성과 똑같으니, 생성 방법을 참고하면 돼요.  
Information 탭에서는 과제에 대한 상세 설명, 포함된 문제, 설정 등을 확인할 수 있어요.  
 <img width="1887" height="875" alt="image" src="https://github.com/user-attachments/assets/87cae538-474f-4924-a4b8-ef2f03913e1f" />  

이제 제출된 코드를 확인하고 성적을 관리하는 과정에 대해 알아볼게요! 


### 제출(Submission)
이 탭에서는 과제에 사용된 문제, 제출한 학생의 학번과 이름, 코드 결과, 사용한 프로그래밍 언어, 제출 시각, 코드 크기, IP를 표로 확인할 수 있어요.
<img width="1436" height="870" alt="image" src="https://github.com/user-attachments/assets/cac98c57-79ac-4cf1-bf3e-3a0676e5cd86" />  

1. `All submissions` 탭에서는 모든 코드를 한꺼번에 볼 수 있어요.
   <img width="1425" height="871" alt="image" src="https://github.com/user-attachments/assets/4401d8d0-550d-4f53-b1b1-f9aaebc3e2e6" />

   - 콤보박스를 클릭해 문제별 제출 코드를 볼 수도 있어요.  
   - 표의 항목을 클릭하면 원본 코드, 테스트케이스별 결과 등 세부 정보를 확인할 수 있어요!
     <img width="1895" height="873" alt="image" src="https://github.com/user-attachments/assets/ed3d21e7-9bbc-4e63-96b7-ab99eb62cf6b" />  

     
2. `Students` 탭에서는 제출 내역을 참여자별로 확인할 수 있어요.  
   <img width="1424" height="869" alt="image" src="https://github.com/user-attachments/assets/39a4c1b4-1ced-4acf-9e7b-db0806121373" />  

   - 각 항목을 클릭하면 참여자 및 참여자가 제출한 코드에 대한 정보를 볼 수 있어요.
    <img width="1429" height="869" alt="image" src="https://github.com/user-attachments/assets/d66933b6-899b-42e6-9368-97e66d7726a7" />

   -  All submissions 탭에서와 같이, 각 제출 항목을 클릭하면 세부 정보를 확인할 수 있어요.  
      <img width="1895" height="873" alt="image" src="https://github.com/user-attachments/assets/a282e441-cd4c-44a0-9eb7-b0b4c31e3c6a" />

   - `Export` 버튼을 클릭해 전체 내역을 Excel 파일 형태로 다운로드 받을 수 있어요.
     <img width="878" height="395" alt="image" src="https://github.com/user-attachments/assets/de40e6d5-a15b-4739-903d-79291a217dc3" />

     
### 채점(Assessment)
이 탭에서는 전체 성적을 관리하고 개별 과제를 채점할 수 있어요.
<img width="1891" height="871" alt="image" src="https://github.com/user-attachments/assets/24965991-db99-4a5d-a0fb-7e4ad41c4e90" />  

채점 탭의 구성 요소를 소개할게요.

**1. 성적 관리**  
 - `Show Scores to Students`: 성적 공개 여부를 선택할 수 있어요. 스위치를 켜서 학생들의 채점 결과와 코멘트를 개별적으로 공개해요.  
 - `Download as a CSV`: 전체 채점 결과를 CSV로 다운로드 받을 수 있어요. 버튼을 누르면 제출한 사람의 학번, 이름, 총점, 그리고 문제별 점수를 정리한 Excel 표를 볼 수 있어요.
   예시: <img width="567" height="132" alt="image" src="https://github.com/user-attachments/assets/50758d89-d482-486d-9012-c93449d5bebf" />  


**2. 과제 채점**
 - 모든 강의 참여자의 학번, 이름, 문제별 점수, 과 총점을 표로 볼 수 있어요.  
 - 문제별 점수와 총점은 각 참여자가 가장 최근에 제출한 코드만을 대상으로 해요.
 - 문제별 점수와 총점에는 통과한 테스트케이스 숫자를 자동으로 반영하고 있어요.   
 - 점수를 나타내는 숫자를 클릭하면 바로 성적을 수정할 수 있어요. 단, 과제를 제출한 적 있는 참여자의 성적만 수정 가능해요.
   <img width="1437" height="875" alt="image" src="https://github.com/user-attachments/assets/ca76ea71-5b3e-499c-ad8e-12aae004228c" />  


**3. 채점 상세**
 - 상세 버튼을 클릭하면 채점 상세 페이지로 이동해요.
  <img width="1351" height="725" alt="image" src="https://github.com/user-attachments/assets/749d0bbd-9c69-40a3-8a43-f89060ff1451" />

 채점 페이지의 구성 요소를 간단히 소개할게요:  
 - `문제`: 과제와 문제 이름을 표시해요. 오른쪽의 `▽`를 클릭해 해당 사용자가 같은 과제의 다른 문제에 대해 제출한 코드의 채점 상세 페이지로 바로 이동할 수 있어요.  
 - `학번`: 코드의 주인을 표시해요. 오른쪽의 `▽`를 클릭해 다른 참여자의 코드로 바로 이동할 수 있어요.  
 - `Submission`: 코드의 정보를 요약해요. 참여자의 ID, 결과, 사용한 프로그래밍 언어, 제출 시각, 코드 크기를 확인할 수 있어요.  
 - `Assessment`: 점수와 코멘트를 입력할 수 있어요. 문제의 총점과 자동 채점된 결과 또한 확인할 수 있어요.  
 - 우측 코드 에디터에서는 원본 코드를 확인하고 수정할 수 있어요.
   <img width="1236" height="813" alt="image" src="https://github.com/user-attachments/assets/2010c6bf-0fc4-4da4-842c-e38abceb4034" />  

   - `Reset` 버튼을 클릭해 수정 사항을 초기화해요.  
   - `Test` 버튼을 클릭해 수정된 코드의 결과를 확인해요.  
   - 우측 하단에서 테스트케이스별 결과를 확인할 수 있어요. 테스트케이스별 번호, 입력값, 기대 출력값, 그리고 실제 출력값을 확인할 수 있어요.  
   - 수정 사항은 저장되지 않아요.  
 - 채점을 모두 마쳤다면, `Save` 버튼을 클릭해 점수와 코멘트를 저장해요.

---

## 연습 문제 관리하기(Exercise)  

이제 강의에 사용되는 연습 문제를 관리하는 방법을 알아보아요.  
연습 문제를 관리하는 방법은 과제와 비슷하지만, **채점 기능은 지원하지 않아요.**
<img width="1901" height="876" alt="image" src="https://github.com/user-attachments/assets/91c4dc06-cf57-4c80-ae70-dbf1826b00d8" />  


먼저 새로운 연습 문제를 생성하는 방법에 대해 살펴볼게요.  
`+ Create` 버튼을 클릭하면 연습 문제 생성 페이지로 이동해요.

### 연습 문제 생성
<img width="948" height="727" alt="image" src="https://github.com/user-attachments/assets/b0d85a29-29fb-402c-8bc6-098abb837c82" />  

이제부터 입력 항목에 대해 알아볼게요. (*은 필수 항목이에요.)  

 1. **Title** *: 연습 문제의 제목을 입력해요.  
    - 120자까지 입력할 수 있어요.
  
 2. **Week** *: 연습 문제를 몇 주차에 노출할지 선택해요.
    
 3. **Start Time** *: 연습 문제가 학생들에게 공개되는 일시를 설정해요.
    
 4. **Due Time**: 연습 문제의 제출 마감 기한을 설정해요. 마감 기한이 지나도 연습 문제를 계속 열람할 수 있어요.
    
 5. **End Time**: 연습 문제의 종료 일시를 설정해요. **종료 일시가 지나면 연습 문제를 더 이상 열람할 수 없어요.**
    
 6. **Description**: 연습 문제에 대한 설명을 입력해요.  
     - 이미지, 30MB 이하의 파일, 표 등을 첨부할 수 있어요.

 7. **Problem List** *: `Import problem` 버튼을 클릭해 연습 문제에 이용할 문제(Problem)를 불러올 수 있어요.  
    <img width="1882" height="874" alt="image" src="https://github.com/user-attachments/assets/13b1ff71-d474-4377-9a89-25e97b501213" />  

     - 현재는 코드당에서 생성된 문제만 불러올 수 있어요. 코드당에서 문제를 생성하는 방법을 알아보려면 [여기](https://docs.codedang.com/user/contest-role-250404.html#contest-admin-%E1%84%80%E1%85%AF%E1%86%AB%E1%84%92%E1%85%A1%E1%86%AB-%E1%84%92%E1%85%AC%E1%86%A8%E1%84%83%E1%85%B3%E1%86%A8-%E1%84%87%E1%85%A1%E1%86%BC%E1%84%87%E1%85%A5%E1%86%B8)를 클릭해주세요!  
     - 불러올 문제를 선택한 후 `Import` 버튼을 클릭하면 문제가 추가돼요.  
     - 연습 문제를 생성하면 해당 문제는 더 이상 Problem에서 볼 수 없으니 주의해 주세요.  
    <img width="932" height="269" alt="image" src="https://github.com/user-attachments/assets/571f09f2-7e88-4ae3-872b-a7c6829e56c3" />  

     - 문제를 다 추가했다면, 각 문제의 총점과 배열 순서를 정할 수 있어요.  
     - 해당 문제가 포함된 다른 과제를 보려면 상세 버튼을 클릭해요.
       
  9. **Solution**: 해답이 있는 문제의 경우, 공개 여부를 선택할 수 있어요.
      (문제 생성 또는 수정 페이지에서 해답을 추가할 수 있어요!)
      
  10. 마지막으로 **히든 테스트케이스 결과 공개 여부**, **복사/붙여넣기 허용 여부**를 선택해요.
      
이제 연습 문제를 생성할 준비를 모두 마쳤어요.  
`Create` 버튼을 누르면 Exercise List에서 내 연습 문제를 볼 수 있어요!😃  

### 개별 연습 문제 보기
Exercise List에서 연습 문제를 클릭하면 해당 연습 문제의 정보를 열람하거나 수정할 수 있어요.  
연습 문제 상세 페이지에는 진행 상태, Start time, End time, 그리고 Due time이 나타나 있어요.  
`Edit` 버튼을 클릭하면 연습 문제 수정 페이지로 이동해요.
연습 문제의 수정 과정은 생성 방법과 똑같으니, 생성 방법을 참고하면 돼요.
Information 탭에서는 연습 문제에 대한 상세 설명, 포함된 문제, 설정 등을 확인할 수 있어요.  
   <img width="1898" height="873" alt="image" src="https://github.com/user-attachments/assets/ceb3e480-55fc-407e-916f-b91f780ba06f" />

이제 제출된 코드를 확인하는 과정에 대해 알아보아요.  

### 제출(Submission)
이 탭에서는 연습 문제에 사용된 문제(Problem), 제출한 학생의 학번과 이름, 코드 결과, 사용한 프로그래밍 언어, 제출 시각, 코드 크기, IP를 표로 확인할 수 있어요.
   <img width="1442" height="875" alt="image" src="https://github.com/user-attachments/assets/553f8461-25ec-448d-848a-01043090b538" />  

1. `All submissions` 탭에서는 모든 코드를 한꺼번에 볼 수 있어요.
   <img width="1346" height="299" alt="image" src="https://github.com/user-attachments/assets/0551c19b-f1aa-405c-9129-72920496588a" />

   - 콤보박스를 클릭해 문제별 제출 코드를 볼 수도 있어요.  
   - 표의 항목을 클릭하면 원본 코드, 테스트케이스별 결과 등 세부 정보를 확인할 수 있어요!
     <img width="1892" height="876" alt="image" src="https://github.com/user-attachments/assets/952e87ff-7aae-4492-b444-7a9411e41185" />
 
2. `Students` 탭에서는 제출 내역을 참여자별로 확인할 수 있어요.
   <img width="1336" height="639" alt="image" src="https://github.com/user-attachments/assets/4a40df3b-98b2-4806-bed4-3481cef045f2" />  
 
   - 각 항목을 클릭하면 참여자 및 참여자가 제출한 코드에 대한 정보를 볼 수 있어요.
     <img width="1437" height="872" alt="image" src="https://github.com/user-attachments/assets/e6cf5555-bf93-4f18-9ffd-8d2a23e43cc1" />

   - All submissions 탭에서와 같이, 각 제출 항목을 클릭하면 세부 정보를 확인할 수 있어요.
     <img width="1894" height="867" alt="image" src="https://github.com/user-attachments/assets/b3c60a78-7638-48a9-81ba-86f61b1fad10" />

   - `Export` 버튼을 클릭해 전체 내역을 Excel 파일 형태로 다운로드 받을 수 있어요.

---

## 강의 수정, 복제, 삭제하기
Course List 화면에 있는 강의를 수정, 복제, 삭제할 수 있어요.  
강의 왼쪽의 체크박스를 클릭한 후, `+ Create` 밑의 버튼을 클릭해 수정, 복제 또는 삭제할 수 있어요.  
<img width="1886" height="872" alt="image" src="https://github.com/user-attachments/assets/3102a2fb-57dc-4bc0-90ac-faa43b03aa60" />

간단하죠?😎  

---

Course Q&A와 Notice 기능은 빠른 시일 내에 지원할 예정이에요.   
조금만 기다려주세요!
