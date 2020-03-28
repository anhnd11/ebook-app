import React, {PureComponent} from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  TextInput,
  ScrollView,
  FlatList,
  ActivityIndicator,
  DeviceEventEmitter,
  Dimensions,
} from 'react-native';
import {connect} from 'react-redux';
import {Icon, Toast} from 'native-base';
import HeaderComponent from '../../components/headerComponents';
import {API, getApiUrl, HOST_IMAGE_UPLOAD} from '../../config/server';
import {Images} from '../../assets/image';
import {postToServer} from '../../config';
import {postToServerWithAccount} from '../../../components/fetch';
import ImageBrowser from '../../../components/multi-select-image/ImageBrowser';
import ImageManipulator from '@pontusab/react-native-image-manipulator';
import ProgressDialog from '../../../components/ProgressDialog';
import {setWidth} from '../../cores/baseFuntion';

class CreatePost extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      visible: true,
      dataImage: [],
      content: '',
      category_id: null,
      imageUpload: [],
      loading: false,
      uploadImage: false,
    };
  }

  componentDidMount = () => {};

  goBack = () => {
    const {navigation} = this.props;
    navigation.goBack();
  };

  launchImageLibrary = () => {
    this.setState({visible: true});
    // const options = {
    //   multiple: true,
    //   compressImageQuality: 0.25,
    // };
    // ImagePicker.openPicker(options).then(image => {
    //   this.postData(image);
    // });
  };

  submit = async () => {
    const {dataImage, imageUpload} = this.state;
    const {accountInfo} = this.props;
    this.setState({uploadImage: true});
    try {
      const response = await postToServerWithAccount(
        getApiUrl(API.UPLOAD_IMAGE),
        {
          token: accountInfo.access_token.token,
        },
        dataImage,
      );
      console.log(response.data, 'a');
      this.setState({
        imageUpload:
          imageUpload.length > 0
            ? [...imageUpload, ...response.data]
            : response.data,
      });
    } catch (e) {
      console.log(e);
    } finally {
      this.setState({uploadImage: false});
    }
  };

  post = async () => {
    const {imageUpload, content, category_id} = this.state;
    const {accountInfo} = this.props;
    this.setState({loading: true});
    try {
      const data = {
        content,
        category_id,
        image: imageUpload,
        token: accountInfo.access_token.token,
        user_id: accountInfo.id,
      };
      const response = await postToServer(getApiUrl(API.ADD_POST), data);
      if (response.status === 1) {
        Toast.show({
          text: 'Thành công! Vui lòng chờ phê duyệt từ admin.',
          duration: 2500,
          position: 'center',
          type: 'success',
        });
        this.goBack();
        DeviceEventEmitter.emit('LoadData');
      }
    } catch (e) {
      console.log(e);
    } finally {
      this.setState({loading: false});
    }
  };

  removeImage = (item, index) => {
    const {dataImage, imageUpload} = this.state;
    this.setState(
      {
        dataImage: dataImage.filter(v => v.uri !== item.uri),
        imageUpload: JSON.parse(imageUpload).splice(index, 1),
      },
      () => {
        console.log('dataImage', dataImage);
        console.log('imageUpload', imageUpload);
      },
    );
  };

  renderItem = ({item, index}) => {
    return (
      <View style={{margin: 8}}>
        <Image
          source={{uri: item.uri}}
          style={{width: Dimensions.get('window').width / 3.5, height: 100}}
          resizeMode="cover"
        />
        {/*<View style={{position: 'absolute', right: 5, top: 5}}>*/}
        {/*  <TouchableOpacity onPress={() => this.removeImage(item, index)}>*/}
        {/*    <Icon*/}
        {/*      name="ios-close-circle"*/}
        {/*      type="Ionicons"*/}
        {/*      style={{color: 'rgba(255,16,27,0.77)', fontSize: 22}}*/}
        {/*    />*/}
        {/*  </TouchableOpacity>*/}
        {/*</View>*/}
      </View>
    );
  };

  getFileFromUri = async image => {
    const type = image.type.split('/')[1];

    return await ImageManipulator.manipulateAsync(
      image.uri,
      [{resize: {width: image.width, height: image.height}}],
      {format: type},
    );
  };

  imageBrowserCallback = callback => {
    this.setState({visible: false});
    if (callback) {
      callback.forEach(image => {
        const newImage = this.getFileFromUri(image);
        const imgNew = {...image, ...newImage};
        let {dataImage} = this.state;
        dataImage = dataImage ? [...dataImage, imgNew] : [imgNew];
        this.setState({dataImage}, () => this.submit());
      });
    }
  };

  hideSelect = () => {
    this.setState({visible: false});
  };

  render() {
    const {navigation, accountInfo} = this.props;
    const {dataImage, content, visible, loading, uploadImage} = this.state;
    return (
      <View style={{flex: 1, backgroundColor: '#FFF'}}>
        <HeaderComponent
          navigation={navigation}
          iconRightStyle={{fontSize: 35}}
          iconLeft="ios-arrow-back"
          left
          right
          typeIconRight="EvilIcons"
          title="Đăng bài viết"
          onPressLeft={this.goBack}
        />
        <ProgressDialog
          visible={uploadImage}
          message="Vui lòng chờ giây lát..."
        />
        <ScrollView>
          <View style={{margin: 16, flexDirection: 'row'}}>
            <Image
              source={
                accountInfo.avatar
                  ? {uri: HOST_IMAGE_UPLOAD + accountInfo.avatar}
                  : Images.avatarDefault
              }
              style={{width: 40, height: 40, borderRadius: 20}}
            />
            <Text style={{marginLeft: 8, marginTop: 8, fontSize: 16}}>
              {accountInfo.name}
            </Text>
          </View>
          <View
            style={{
              marginHorizontal: 8,
              minHeight: 250,
              borderBottomColor: '#AAA',
              borderBottomWidth: 0.5,
            }}>
            <TextInput
              // autoFocus
              value={content}
              placeholder="Nhập nội dung"
              placeholderTextColor="#CCC"
              style={{color: '#000'}}
              onChangeText={text => this.setState({content: text})}
              multiline
            />
            <View style={{marginTop: 16}}>
              <FlatList
                data={dataImage}
                numColumns={3}
                renderItem={this.renderItem}
                keyExtractor={() => String(Math.random())}
              />
            </View>
          </View>
          <View style={{padding: 16}}>
            <TouchableOpacity
              style={{flexDirection: 'row', alignItems: 'center', height: 32}}
              onPress={this.launchImageLibrary}>
              <Icon
                name="file-photo-o"
                type="FontAwesome"
                style={{fontSize: 22}}
              />
              <Text style={{marginLeft: 16, fontSize: 18}}>Thư viện ảnh</Text>
            </TouchableOpacity>
          </View>
          {visible ? (
            <ImageBrowser
              max={10}
              hideSelect={this.hideSelect}
              visible={visible}
              callback={this.imageBrowserCallback}
              selectedCount={dataImage && dataImage.length}
            />
          ) : null}
        </ScrollView>
        {dataImage.length > 0 || content ? (
          <TouchableOpacity
            style={{
              backgroundColor: 'rgba(255,16,27,0.77)',
              alignItems: 'center',
              justifyContent: 'center',
              height: 48,
            }}
            onPress={this.post}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={{color: '#FFF', fontSize: 18}}>ĐĂNG BÀI</Text>
            )}
          </TouchableOpacity>
        ) : null}
      </View>
    );
  }
}

const mapStateToProps = state => ({
  accountInfo: state.accountReducer,
});

export default connect(mapStateToProps)(CreatePost);