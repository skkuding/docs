# 대회 생성하기 #

본 Section에서는 대회 생성 기능에 대해서 소개합니다.   

기본적으로 대회는 Management 페이지의 **Contest** 메뉴에서 관리할 수 있어요. 

![Contest List](https://github.com/user-attachments/assets/02f3fff2-e969-4d42-91ab-92675343457f)   

## 대회 직접 만들기 ##   
우측 상단의 **`+ Create`** 버튼을 누르면 **Create Contest** 페이지에서 새로운 대회를 생성할 수 있어요.   
지금부터 각 섹션의 역할을 하나씩 알아볼게요.   

![Create Contest](https://github.com/user-attachments/assets/568c8ea4-42d6-4ff6-ba45-76a91a276a8f)


1. **`Title`** * : 대회의 이름을 입력해요. 최대 200자까지 입력할 수 있어요.
   
2. **`Start Time`** * : 대회가 시작하는 시간을 `YYYY-MM-DD HH:MM:SS` 단위로 설정해요.
   - 시작 시간이 되면 대회가 자동으로 공개되고, 다른 사용자들이 대회에 참여할 수 있어요.

3. **`End Time`** * : 대회가 종료되는 시간을 `YYYY-MM-DD HH:MM:SS` 단위로 설정해요.
   - 종료 시간이 되면 대회 참여자들은 더 이상 대회에서 문제를 풀 수 없어요.

4. **`Description`** * : 대회의 설명을 작성해요. 링크, 수식, 이미지 첨부가 가능해요.

5. **`Enable participants Copy/Pasting`** : 대회 참여자들이 문제를 풀 때 복사·붙여넣기를 사용할 수 있을지를 결정해요.

6. **`Reveal scores to participants`** : 대회 참여자들에게 점수를 공개할지를 결정해요.

7. **`Invitation Code`** : 대회의 참여 코드를 설정하여 비공개 대회를 생성할 수 있어요.
    - 참여 코드는 **6자리 숫자**로 설정할 수 있어요.

8. **`Contest Problem List`** * : **Import·Edit Problem** 버튼을 눌러, 미리 생성된 문제 목록에서 대회에 포함될 문제를 불러올 수 있어요.
   ![import 모달](https://github.com/user-attachments/assets/7a0385aa-5887-44cd-bb35-1d31e422a98b)
    - 1개 이상의 대회에 포함된 문제는 전체 문제 목록에서 자동으로 **비공개**로 전환돼요.
    - 다른 대회에 포함된 문제도 불러올 수 있어요. 불러온 문제가 어떤 문제에 포함되었는지 알고 싶다면 파일 아이콘을 클릭해 보세요.
   ![Contest Problem List](https://github.com/user-attachments/assets/c6e5093d-c7e8-463b-a8f1-1716129b6527)
    - **Score**는 문제 별 점수를 설정할 수 있는 란이에요. 점수 설정에 대한 별도의 제한은 없어요.
    - **Order**는 문제의 번호를 지정할 수 있는 란이에요.   


## 대회 복제하기 ##   

1개의 대회를 선택하고 우측 상단의 **`Duplicate`** 버튼을 누르면 **이미 만들어진 대회를 복제**할 수 있어요.   
![Contest List Duplicate](https://github.com/user-attachments/assets/8f31ae61-6f94-43b3-9cf4-1749559fadff)

1. 대회를 아무 것도 선택하지 않거나 2개 이상의 대회를 선택하면 버튼이 비활성화돼요.
  
2. 대회가 복제되면, 아래와 같은 정보들이 함께 복사돼요.
   - Title
   - Start Time
   - End Time
   - Description
   - Enable participants Copy/Pasting (토글 ON/OFF 상태)
   - Reveal scores to participants (토글 ON/OFF 상태)
   - Invitation Code
   - Contest Problem List

3. 단, 대회가 복제되면 아래와 같은 정보는 **복사되지 않으니** 주의해 주세요.
    - 대회 참여자의 **제출 정보**
    - 대회 참여자가 **대회에서 획득한 점수**
  
4. **현재 진행 중인 대회**를 복제하면, 복제된 대회는 자동으로 대회 리스트에 **공개**돼요.

5. **진행 예정인 대회**이거나 **이미 종료된 대회**를 복제하면, 복제된 대회는 자동으로 대회 리스트에 **비공개**돼요.
