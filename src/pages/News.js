import React, {PureComponent} from 'react';
import {
  Image,
  StyleSheet,
  View,
  TouchableOpacity,
  FlatList,
  RefreshControl,
  VirtualizedList,
  TouchableWithoutFeedback,
  DeviceEventEmitter,
  ScrollView,
} from 'react-native';
import {Button, Container, Text, Content, Icon} from 'native-base';
import {connect} from 'react-redux';
import {API, getApiUrl, HOST_IMAGE_UPLOAD} from '../config/server';
import {Images} from '../assets/image';
import {setWidth} from '../cores/baseFuntion';
import FastImage from 'react-native-fast-image';
import Modal from 'react-native-modal';
import {getFromServer} from '../config';
import {formatDateNow} from '../../components/until';
import {
  LazyLoadingListing,
  LazyLoadingProject,
} from '../../components/lazy-load';
import color from '../assets/static-data/color';

class News extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      textHello: '',
      refreshing: false,
      data: [],
      isRules: true,
      modalRule: false,
      lazy: true,
      category_id: 0,
      page: 1,
      categories: [],
    };
  }

  async componentDidMount() {
    await this.getData();
    this.getCategory();
    const date = new Date();
    if (date.getHours() < 12 && date.getHours() >= 6) {
      this.setState({textHello: 'Chào buổi sáng!'});
    }
    if (date.getHours() >= 12 && date.getHours() < 18) {
      this.setState({textHello: 'Chào buổi chiều!'});
    }
    if (
      (date.getHours() >= 18 && date.getHours() < 24) ||
      (date.getHours() >= 0 && date.getHours() < 6)
    ) {
      this.setState({textHello: 'Chào buổi tối!'});
    }
    this.listener = DeviceEventEmitter.addListener('LoadData', () =>
      this.onRefresh(),
    );
  }

  componentWillUnmount(): void {
    this.listener.remove();
  }

  getCategory = async () => {
    const {accountInfo} = this.props;
    try {
      const response = await getFromServer(getApiUrl(API.CATEGORY), {
        token: accountInfo.access_token.token,
        page: 1,
        page_size: 50,
      });
      this.setState({categories: response.data?.slice(0, 10)});
    } catch (e) {
      console.log(e);
    }
  };

  getData = async () => {
    const {accountInfo} = this.props;
    const {category_id, page, data} = this.state;
    try {
      const response = await getFromServer(getApiUrl(API.LIST_POST), {
        token: accountInfo.access_token.token,
        page,
        page_size: 50,
        category_id,
      });
      console.log(response);
      this.setState({
        data: page === 1 ? response.data : [...data, ...response.data],
      });
    } catch (e) {
      console.log(e);
    } finally {
      this.setState({refreshing: false, lazy: false});
    }
  };

  onRefresh = async () => {
    await this.setState({refreshing: true, page: 1, lazy: true, data: []});
    this.getData();
    this.getCategory();
  };

  refreshControl() {
    const {refreshing} = this.state;
    return (
      <RefreshControl refreshing={refreshing} onRefresh={this.onRefresh} />
    );
  }

  selectCate = item => {
    const {category_id} = this.state;
    if (category_id === item.cid) {
      this.setState({category_id: null}, () => this.onRefresh());
      return;
    }
    this.setState({category_id: item.cid}, () => this.onRefresh());
  };

  renderCate = ({item}) => {
    const {category_id} = this.state;
    if (item.category_name)
      return (
        <TouchableOpacity
          style={{
            backgroundColor:
              category_id === item.cid ? '#00c068' : 'rgba(0,192,104,0.13)',
            padding: 4,
            borderRadius: 4,
            margin: 6,
          }}
          onPress={() => this.selectCate(item)}>
          <Text
            style={{color: category_id === item.cid ? '#FFF' : '#00c068'}}
            numberOfLines={1}>
            {item.category_name.substring(0, 20)}
          </Text>
        </TouchableOpacity>
      );
    return null;
  };

  navigateDetail = item => {
    const {navigation} = this.props;
    navigation.navigate('NewsDetailScreen', {data: item, visible: true});
  };

  regexStringToTag = str => {
    let r = str;
    r = r.replace(new RegExp(/\s/g), '');
    r = r.replace(new RegExp(/[àáâãäå]/g), 'a');
    r = r.replace(new RegExp(/æ/g), 'ae');
    r = r.replace(new RegExp(/ç/g), 'c');
    r = r.replace(new RegExp(/đ/g), 'd');
    r = r.replace(new RegExp(/[èéêë]/g), 'e');
    r = r.replace(new RegExp(/[ìíîï]/g), 'i');
    r = r.replace(new RegExp(/ñ/g), 'n');
    r = r.replace(new RegExp(/[òóôõöơớố]/g), 'o');
    r = r.replace(new RegExp(/œ/g), 'oe');
    r = r.replace(new RegExp(/[ùúûüư]/g), 'u');
    r = r.replace(new RegExp(/[ýÿ]/g), 'y');
    r = r.replace(new RegExp(/\W/g), '');
    return r;
  };

  renderItem = ({item}) => {
    const {navigation} = this.props;
    const dataImage = item.image !== null ? JSON.parse(item.image) : [];
    return (
      <TouchableWithoutFeedback
        onPress={() =>
          navigation.navigate('NewsDetailScreen', {data: item, visible: false})
        }
        disabled={item.is_confirm === 0}>
        <View
          style={{
            backgroundColor: '#FFF',
            shadowColor: '#000',
            shadowOffset: {
              width: 0,
              height: 1,
            },
            shadowOpacity: 0.1,
            shadowRadius: 4,
            elevation: 2,
            marginBottom: 16,
            marginLeft: 4,
            padding: 16,
            width: setWidth('90%'),
            borderRadius: 4,
          }}>
          {item.is_confirm === 0 ? (
            <View
              style={{
                position: 'absolute',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                width: setWidth('90%'),
                height: 80,
                zIndex: 22,
                alignItems: 'center',
                justifyContent: 'center',
                top: '20%',
              }}>
              <Text
                style={{
                  color: '#FFF',
                  fontSize: 18,
                  fontFamily: 'SF Pro Text',
                }}>
                Bài viết đang chờ phê duyệt...
              </Text>
            </View>
          ) : null}
          <View style={{flexDirection: 'row'}}>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate('ProfileSocial', {user_id: item.user_id})
              }
              style={{flexDirection: 'row', flex: 1}}>
              <Image
                source={
                  item.avatar_author
                    ? {
                        uri:
                          HOST_IMAGE_UPLOAD + JSON.parse(item.avatar_author)[0],
                      }
                    : Images.avatarDefault
                }
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                }}
                resizeMode="cover"
              />
              <View style={{marginLeft: 16, flex: 1}}>
                <Text
                  style={{
                    fontWeight: 'bold',
                    fontSize: 15,
                    color: '#000',
                  }}>
                  {item.author}
                </Text>
                <Text style={{color: '#A7A9BC', fontSize: 12}}>
                  {formatDateNow(item.created_at)}
                </Text>
              </View>
            </TouchableOpacity>
          </View>
          <View style={{marginVertical: 8}}>
            <Text numberOfLines={4}>{item.content}</Text>
          </View>
          <View
            style={{
              flex: 1,
              flexWrap: 'wrap',
              flexDirection: 'row',
              justifyContent: 'space-between',
            }}>
            {dataImage !== null &&
              dataImage.map((v, index) => {
                if (index === 0) {
                  return (
                    <TouchableOpacity
                      disabled={item.is_active === 0}
                      onPress={() =>
                        navigation.navigate('NewsDetailScreen', {
                          data: item,
                          visible: false,
                        })
                      }>
                      <FastImage
                        source={{
                          uri: HOST_IMAGE_UPLOAD + v,
                          priority: FastImage.priority.high,
                        }}
                        style={{
                          width: setWidth('82%'),
                          height:
                            dataImage.length === 1
                              ? setWidth('50')
                              : setWidth('40%'),
                          borderRadius: 4,
                        }}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  );
                }
                if (index <= 1) {
                  return (
                    <TouchableOpacity
                      style={{
                        marginVertical: 8,
                      }}
                      onPress={() =>
                        navigation.navigate('NewsDetailScreen', {
                          data: item,
                          visible: false,
                        })
                      }>
                      <FastImage
                        source={{uri: HOST_IMAGE_UPLOAD + v}}
                        style={{
                          width: setWidth('40%'),
                          height: setWidth('40%'),
                          borderRadius: 4,
                        }}
                        resizeMode="cover"
                      />
                    </TouchableOpacity>
                  );
                }
                if (index === 2) {
                  return (
                    <TouchableOpacity
                      style={{
                        marginVertical: 8,
                      }}
                      onPress={() =>
                        navigation.navigate('NewsDetailScreen', {
                          data: item,
                          visible: false,
                        })
                      }>
                      <FastImage
                        source={{uri: HOST_IMAGE_UPLOAD + v}}
                        style={{
                          width: setWidth('40%'),
                          height: setWidth('40%'),
                          borderRadius: 4,
                        }}
                        resizeMode="cover"
                      />
                      {dataImage.length > 3 ? (
                        <View style={styles.viewAbsoluteImg}>
                          <View style={styles.viewLengthImg}>
                            <Text style={styles.txtLength}>
                              + {dataImage.length - 3}
                            </Text>
                            <Text style={styles.labelImg}> ẢNH</Text>
                          </View>
                        </View>
                      ) : null}
                    </TouchableOpacity>
                  );
                }
                return null;
              })}
          </View>
          <View style={{marginTop: 16}}>
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                borderTopColor: 'whitesmoke',
                borderTopWidth: 1,
                paddingTop: 16,
                justifyContent: 'center',
              }}
              disabled={item.is_confirm === 0}
              onPress={() => this.navigateDetail(item)}>
              <Icon
                name="commenting-o"
                type="FontAwesome"
                style={{
                  fontSize: 22,
                  fontWeight: 'normal',
                  color: '#AAA',
                }}
              />
              <Text style={{marginLeft: 8, color: '#AAA'}}>
                Bình luận ({item.user_comments || 0}){' '}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  };

  closePopup = () => {
    this.setState({modalRule: false});
  };

  render() {
    const {navigation, accountInfo} = this.props;
    const {
      textHello,
      refreshing,
      isRules,
      modalRule,
      data,
      lazy,
      categories,
    } = this.state;
    const rules = [
      'Tất cả bài đăng phải chờ phê duyệt từ admin.',
      'Không đăng bài có nội dung xấu, nhạy cảm,...',
      'Có thể đăng các bài viết về mua bán, trao đổi sách.',
      'Có thể đăng bài giới thiệu sách và buộc phải có thể loại kèm theo.',
    ];
    return (
      <Container>
        <View style={styles.container}>
          <View
            style={{
              marginTop: 24,
              marginBottom: 16,
              flexDirection: 'row',
              marginLeft: 24,
              marginRight: 16,
              alignItems: 'center',
            }}>
            {/* <Image
                source={
                  accountInfo.avatar
                    ? {
                        uri:
                          HOST_IMAGE_UPLOAD + JSON.parse(accountInfo.avatar)[0],
                      }
                    : Images.avatarDefault
                }
                style={{width: 40, height: 40, borderRadius: 20}}
              /> */}

            <TouchableOpacity
              onPress={this.onRefresh}
              style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
              <Image
                source={Images.iconLogin2}
                style={{width: 26, height: 26}}
              />
              <Text
                style={{
                  fontSize: 26,
                  color: color.primaryColor,
                  fontWeight: 'bold',
                  marginLeft: 8,
                  fontStyle: 'italic',
                }}>
                Newsfeed
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => navigation.navigate('Notification')}>
              <Icon
                name={'ios-notifications-outline'}
                type={'Ionicons'}
                style={{
                  fontSize: 24,
                  color: color.primaryColor,
                }}
              />
            </TouchableOpacity>
          </View>
          <Content
            refreshing={refreshing}
            refreshControl={this.refreshControl()}>
            <View style={{flexDirection: 'row', padding: 16}}>
              <TouchableOpacity
                style={{
                  backgroundColor: '#FFF',
                  shadowColor: '#000',
                  shadowOffset: {
                    width: 0,
                    height: 1,
                  },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 3,
                  height: 102,
                  flex: 1,
                  borderRadius: 6,
                  justifyContent: 'center',
                }}
                onPress={() =>
                  navigation.navigate('CreatePostScreen', {visible: false})
                }>
                <View
                  style={{
                    flexDirection: 'row',
                    paddingHorizontal: 16,
                    flex: 1,
                    marginTop: 16,
                  }}>
                  <Image
                    source={
                      accountInfo.avatar
                        ? {
                            uri:
                              HOST_IMAGE_UPLOAD +
                              JSON.parse(accountInfo.avatar)[0],
                          }
                        : Images.avatarDefault
                    }
                    style={{width: 40, height: 40, borderRadius: 20}}
                  />
                  <Text
                    note
                    style={{
                      fontSize: 16,
                      marginLeft: 16,
                      flex: 1,
                    }}>
                    Đăng bài viết mới
                  </Text>
                </View>
                <View style={{flexDirection: 'row', backgroundColor: '#ccc2'}}>
                  <TouchableOpacity
                    style={{
                      flex: 1,
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: 4,
                    }}
                    onPress={() =>
                      navigation.navigate('CreatePostScreen', {visible: true})
                    }>
                    <Icon
                      name={'image'}
                      type={'EvilIcons'}
                      style={{color: color.primaryColor}}
                    />
                    <Text>Thư viện</Text>
                  </TouchableOpacity>
                  {/*<TouchableOpacity*/}
                  {/*  style={{*/}
                  {/*    flex: 1,*/}
                  {/*    flexDirection: 'row',*/}
                  {/*    alignItems: 'center',*/}
                  {/*    justifyContent: 'center',*/}
                  {/*  }}*/}
                  {/*  onPress={() => navigation.navigate('CreatePostScreen')}>*/}
                  {/*  <Icon*/}
                  {/*    name={'camera'}*/}
                  {/*    type={'EvilIcons'}*/}
                  {/*    style={{color: color.red}}*/}
                  {/*  />*/}
                  {/*  <Text>Máy ảnh</Text>*/}
                  {/*</TouchableOpacity>*/}
                </View>
              </TouchableOpacity>
            </View>
            <View style={{margin: 16}}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <View
                  style={{width: 4, height: 24, backgroundColor: '#00c068'}}
                />
                <Text style={{marginLeft: 5, fontSize: 18}}>Chủ đề HOT</Text>
              </View>
              <View
                style={{
                  flexWrap: 'wrap',
                  flex: 1,
                  marginVertical: 8,
                  flexDirection: 'row',
                }}>
                <FlatList
                  data={categories}
                  horizontal
                  contentContainerStyle={{flex: 1, flexWrap: 'wrap'}}
                  keyExtractor={() => String(Math.random())}
                  renderItem={this.renderCate}
                />
              </View>
            </View>
            <View style={{margin: 16}}>
              <View style={{flexDirection: 'row', alignItems: 'center'}}>
                <View
                  style={{width: 4, height: 24, backgroundColor: '#00c068'}}
                />
                <Text style={{marginLeft: 5, fontSize: 18}}>Bài viết</Text>
              </View>
              <LazyLoadingProject length={1} visible={lazy} />
              <VirtualizedList
                getItem={(d, index) => d[index]}
                getItemCount={d => d?.length}
                data={data}
                style={{marginTop: 16}}
                contentContainerStyle={{marginVertical: 16}}
                keyExtractor={item => String(item.id)}
                renderItem={this.renderItem}
                maxToRenderPerBatch={6}
                updateCellsBatchingPeriod={100}
                removeClippedSubviews
                extraData={data}
              />
            </View>
          </Content>
        </View>
        <Modal
          isVisible={modalRule}
          backdropOpacity={0.5}
          backdropColor="#000"
          animationIn="fadeIn"
          animationOut="fadeOut"
          animationInTiming={300}
          animationOutTiming={300}
          backdropTransitionInTiming={300}
          backdropTransitionOutTiming={300}
          useNativeDriver
          hideModalContentWhileAnimating
          onBackdropPress={this.closePopup}
          onBackButtonPress={this.closePopup}
          style={styles.modal}>
          <View
            style={{
              width: setWidth('80%'),
              backgroundColor: '#FFF',
              borderRadius: 4,
              padding: 16,
            }}>
            <View style={{alignItems: 'center'}}>
              <Image
                source={Images.imgRules}
                style={{width: 200, height: 200}}
                resizeMode="contain"
              />
            </View>

            <Text style={{fontSize: 22}}>Nội quy trong cộng đồng:</Text>
            <View>
              {rules.map(item => (
                <View
                  style={{
                    flexDirection: 'row',
                    width: setWidth('60%'),
                    paddingVertical: 8,
                  }}>
                  <Icon
                    name="dot-single"
                    type="Entypo"
                    style={{color: '#00c068'}}
                  />
                  <Text style={{fontSize: 16}}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        </Modal>
      </Container>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modal: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewAbsoluteImg: {
    position: 'absolute',
    width: setWidth('40%'),
    height: setWidth('40%'),
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txtLength: {color: '#FFF', fontSize: 16},
  labelImg: {textAlign: 'right', color: '#FFF'},
  viewLengthImg: {
    marginRight: 5,
    marginTop: 5,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
});

const mapStateToProps = state => ({
  accountInfo: state.accountReducer,
});

export default connect(mapStateToProps)(News);
