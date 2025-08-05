# 대회 개최하기

본 Section에서는 대회를 개최하는 방법을 설명합니다.    
대회 개최는 Contest Admin 권한을 가진 사용자만 가능합니다.    
권한을 얻을 수 있는 방법이 궁금하다면 [여기](https://docs.codedang.com/user/contest-role-250404.html)를 클릭해 주세요!    

---

대회 개최, 문제 출제 등의 모든 관리는 Management 페이지에서 가능해요.   
로그인 후, 화면 상단 우측에 있는 내 ID를 클릭하면 Management 페이지로 이동할 수 있는 메뉴가 나와요.   
![management](https://github.com/user-attachments/assets/eb0c6024-eb52-4761-acf6-9496ead5cd93)    

기본적으로 대회는 Management 페이지의 **Contest** 메뉴에서 관리할 수 있어요.  
우측 상단의 **`+ Create`** 버튼을 누르면 대회의 기본 정보를 입력할 수 있는 페이지로 이동해요.   
![Contest Management](https://github.com/user-attachments/assets/fda8c9cf-e114-4346-ba26-230a890d54bd)

## 대회 기본 정보 입력

이제 Create Contest 페이지에서 새로운 대회를 개최할 수 있어요!   
지금부터 입력 항목에 대해 알아볼게요. (*은 필수 입력 항목이에요.)      

![Create Contest_수정](https://github.com/user-attachments/assets/2ccb7978-d3f6-41bd-a25b-82f3165ecc94)

1. **`Upload Your Poster`** : 대회의 포스터를 업로드해요.
   - 20MB 이하의 PNG, JPG, JPEG 파일만 업로드할 수 있어요.

2. **`Title`** * : 대회의 이름을 입력해요.
   - 공백 포함 120자까지 입력할 수 있어요.
   
3. **`Start Time`** * : 대회의 시작 시각을 설정해요.
   - 시작 시각 이전에도 모든 사용자에게 대회가 공개되고, 모든 사용자는 시작 전에도 대회에 등록할 수 있어요.
   - 단, 대회의 문제 목록은 대회 시작 시각 이후에 대회 참여자에게만 공개돼요.

4. **`End Time`** * : 대회의 종료 시각을 설정해요.
   - 종료 시각이 되면 대회 참여자들은 더 이상 대회에서 문제를 풀 수 없어요.
  
5. **`Leaderboard Freeze`** : 리더보드의 프리즈 여부와 시작 시각을 설정해요.
   - 리더보드 프리즈의 자세한 설명은 [여기](https://docs.codedang.com/user/contest-leaderboard-250404.html)에서 확인할 수 있어요!

6. **`Summary`** : 대회의 설명을 템플릿 형태로 작성해요.
   - 템플릿의 행을 추가하거나 키워드를 변경할 수 없어요.
   - 현재 코드당의 순위 선정 방식에 따라, **순위 산정**의 내용을 변경할 수 없어요. 자세한 내용은 여기에서 확인할 수 있어요.

7. **`More Description`** : 대회의 추가적인 설명을 작성해요.
  
8. **`Evaluate with sample testcase included`** : 문제 채점 시 샘플 테스트케이스의 포함 여부를 설정해요.
   - 스위치를 켜면 샘플 테스트케이스와 히든 테스트케이스를 포함하여 문제가 채점해요.
   - 스위치를 끄면 히든 테스트케이스만 포함하여 문제를 채점해요.
   - 해당 대회에 포함된 모든 문제에 적용돼요.

9. **`Invitation Code`** : 대회의 참여 코드를 설정하여 비공개 대회를 생성할 수 있어요.
    - 참여 코드는 **6자리 숫자**로만 설정할 수 있어요.

## Contest Manager, Contest Reviewer 추가하기

![add manager](https://github.com/user-attachments/assets/5f7e09ca-19c7-447f-886b-0572c7dc4c3e)
Contest Manager와 Contest Reviewer는 `Add manager / reviewer` 섹션에서 `+ Add` 버튼을 눌러 추가할 수 있어요.   
두 권한에 대한 자세한 설명은 [여기](https://docs.codedang.com/user/contest-role-250404.html)에서 확인할 수 있어요.   

![Add 모달](https://github.com/user-attachments/assets/0c090ebe-74db-4617-ab85-3ee80599c953)   
`+ Add` 버튼을 누르면 Contest Manager와 Contest Reviewer를 추가할 수 있는 모달이 나와요.   
Contest Manager 혹은 Contest Reviewer로 추가하고 싶은 사용자의 이메일을 입력해주세요.    
⚠️ 반드시 코드당에 가입되어 있는 이메일을 입력해주세요. Contest Manager와 contest Reviewer는 모두 코드당 회원이어야만 해요.   
⚠️ 대회에 참여자로 등록한 사용자는 Contest Manager나 Reviewer가 될 수 없어요.

![Add 모달-2](https://github.com/user-attachments/assets/e7dc38a2-91c7-4df7-9c6d-5070864d3880)    
드롭다운을 누르면 권한을 수정할 수 있어요. 단, 같은 사용자에게 두 가지 권한을 모두 부여할 수는 없어요.   
추가된 Contest Manager와 Contest Reviewer는 Create Contest 최하단의 `Create` 버튼 클릭 즉시 반영돼요.   
(별도로 추가된 사용자에게 승인을 받지 않아도 돼요.)   

## 대회에 문제 불러오기

![Problem List-1](https://github.com/user-attachments/assets/f54d28aa-8ffb-40dc-a66c-bac7ea2495e0)   
`Contest Problem List` 섹션에서 `+ Import Problem` 버튼을 눌러 대회에 문제를 불러올 수 있어요.   

![Importing Problem-1](https://github.com/user-attachments/assets/49d3e2e8-9d8c-4a88-9f45-03455ef5a635)    
대회에 포함된 문제는 Problem 페이지의 전체 문제 목록에서 **비공개**로 바뀐다는 안내 문구예요.    
`OK`를 눌러 진행해주세요.    

![Import Problem](https://github.com/user-attachments/assets/55309417-d6f6-4330-b68f-2e3d68ac1d52)   
원하는 문제를 선택해서 불러올 수 있어요.    
하나의 대회에 문제는 20개까지만 불러올 수 있으니 주의해주세요.   

![Included 모달](https://github.com/user-attachments/assets/981e99e1-de2c-406e-852e-4023d63fdd28)    
하나의 문제는 여러 대회 혹은 강의에 포함될 수 있어요.   
특정 문제가 포함되어 있는 대회 혹은 강의를 확인하고 싶다면 `Include` 아이콘을 클릭해보세요.   

![Problem List-2](https://github.com/user-attachments/assets/1fc5ef84-4488-41f6-b866-8cf35bb9f449)   
불러온 문제는 `Order`에서 순서를 설정할 수 있어요.   

✔️ 최초 대회 생성 시 Contest Manager가 만든 문제가 보이지 않을 수도 있어요.   
그럴 때는 우선 `Create` 버튼을 누른 후, [`Edit Contest` 화면](https://docs.codedang.com/user/contest-management-250404.html#%E1%84%83%E1%85%A2%E1%84%92%E1%85%AC-%E1%84%89%E1%85%AE%E1%84%8C%E1%85%A5%E1%86%BC%E1%84%92%E1%85%A1%E1%84%80%E1%85%B5)에서 다시 문제를 불러와 주세요!   

---

이제 대회를 개최할 준비가 끝났어요!   
**`Create`** 버튼을 눌러 대회를 모든 사용자에게 공개해보세요 😊   
