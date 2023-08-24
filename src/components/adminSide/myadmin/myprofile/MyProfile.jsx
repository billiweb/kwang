import React, { useEffect, useState } from 'react';
import { Row, Col, Button, Modal, Upload } from 'antd';
import { styled } from 'styled-components';
import { db, storage } from '../../../../firebase/firebaseConfig';
import { nanoid } from 'nanoid';
import { doc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import defaultProfileImage from '../../../../assets/images/profile-default-image.png';
import {
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  listAll,
} from 'firebase/storage';

const MyProfile = () => {
  // 로그인된 유저 정보 가져오기
  const auth = getAuth();
  const user = auth.currentUser;
  console.log(user);
  console.log(user?.email);

  const [modalVisible, setModalVisible] = useState(false);
  const [nickname, setNickname] = useState(user?.email); // 닉네임이 어떻게 들어오는지에 따라 변경할 예정
  const [introduction, setIntroduction] = useState('');
  const [previewImage, setPreviewImage] = useState(defaultProfileImage);
  const [selectedImage, setSelectedImage] = useState(null);
  const [updatedImage, setUpdatedImage] = useState(defaultProfileImage);

  useEffect(() => {
    // 유저가 사용 가능한 상태일 때, 닉네임과 소개의 초기값 설정
    if (user) {
      setNickname(user.email || ''); // 기본값으로 빈 문자열 사용 // 닉네임으로 교체 예정
    }
  }, [user]);

  // 프로필 정보를 업데이트 하는 버튼 함수
  const handleProfileUpdate = async () => {
    try {
      // 기존 user.uid 폴더의 이미지들 삭제
      const userImagesRef = ref(storage, `profileImages/${user.uid}`);
      const userImagesList = await listAll(userImagesRef);

      // userImagesList.items 배열에 있는 모든 이미지 삭제
      await Promise.all(
        userImagesList.items.map(async (item) => {
          await deleteObject(item);
        }),
      );

      // Firebase에 프로필 이미지 업로드
      if (selectedImage) {
        const imageRef = ref(storage, `profileImages/${user.uid}/${nanoid()}`); // nanoid를 실행시켜서 업데이트 속도가 조금 느린건가?
        await uploadBytes(imageRef, selectedImage); // storage에 이미지 업로드
        const imageURL = await getDownloadURL(imageRef);
        setUpdatedImage(imageURL);
      }

      setModalVisible(false); // 모달 닫기
    } catch (error) {
      console.error('프로필 업데이트 실패', error);
    }
  };

  return (
    <div>
      <Row justify="center" align="middle" style={{ padding: '20px 0' }}>
        <Col span={24} style={{ textAlign: 'center' }}>
          {/* <Profile /> */}
          <ProfileImage src={updatedImage} />
          <div style={{ margin: '20px 0 10px' }}>{user?.email}</div>
          <div style={{ margin: '20px 0' }}>소개</div>
          <Button
            onClick={() => {
              setModalVisible(true);
            }}
          >
            내 정보 수정하기
          </Button>
        </Col>
      </Row>
      <Modal
        title="내 정보 수정하기"
        centered
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
        }}
        width={300}
        footer={
          <Button
            key="upload"
            type="primary"
            onClick={handleProfileUpdate}
            style={{ width: '100%' }}
          >
            저장하기
          </Button>
        }
      >
        {/* 모달 내용 */}
        <ProfileContainer>
          {/* 프로필 이미지 미리보기 */}
          <PreviewImage src={previewImage} alt="이미지 미리보기" />
          <input
            type="file"
            onChange={(e) => {
              const file = e.target.files[0];
              if (file) {
                setSelectedImage(file);
                setPreviewImage(URL.createObjectURL(file));
              }
            }}
          />
          <div style={{ marginTop: '20px' }}>닉네임</div>
          <ProfileInput
            placeholder="변경하실 닉네임을 작성해주세요."
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
          />
          <div style={{ marginTop: '5px' }}>소개</div>

          <ProfileInput
            placeholder="소개를 작성해 주세요."
            value={introduction}
            onChange={(e) => setIntroduction(e.target.value)}
            style={{ marginBottom: '20px' }}
          />
        </ProfileContainer>
      </Modal>
    </div>
  );
};

export default MyProfile;

const ProfileInput = styled.input`
  width: 96%;
  height: 25px;
`;

const ProfileContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const ProfileImage = styled.img`
  width: 140px;
  height: 140px;
  object-fit: cover; // 이미지가 잘리지 않도록 설정
  background-color: #d6d6d6;
  border-radius: 100%;
`;

const PreviewImage = styled.img`
  width: 140px;
  height: 140px;
  object-fit: cover; // 이미지가 잘리지 않도록 설정
  background-color: #d6d6d6;
  border-radius: 100%;
`;
