# 摸鱼派 API 文档

## 基础信息
- 基础URL: `https://fishpi.cn`
- 认证方式: API Key
- 请求格式: JSON
- 响应格式: JSON

## 通用说明
1. 所有需要认证的接口都需要在请求中携带 `apiKey` 参数
2. 如果 API Key 无效，会返回 code: -1 的错误响应
3. 文件上传大小限制：<=20M
4. 支持的文件格式：jpg, jpeg, png, gif, mp4

## 接口列表

### 1. 用户相关接口

#### 1.1 登录
- 请求路径：`/api/getKey`
- 请求方法：POST
- 请求参数：
  ```json
  {
    "nameOrEmail": "用户名或邮箱",
    "userPassword": "MD5加密后的密码",
    "mfaCode": "两步认证码（可选）"
  }
  ```
- 返回值说明：
  - code: 状态码，0为成功，-1为失败
  - msg: 提示信息
  - data: 登录成功时包含apiKey
  - 示例：
    ```json
    {
      "code": 0,
      "msg": "登录成功",
      "data": {
        "apiKey": "xxxxxx"
      }
    }
    ```

#### 1.2 注册
- 请求路径：`/register`
- 请求方法：POST
- 请求参数：注册信息对象
- 返回值说明：
  - code: 状态码
  - msg: 提示信息
  - 示例：
    ```json
    { "code": 0, "msg": "发送验证码成功" }
    ```

#### 1.3 验证短信验证码
- 请求路径：`/verify`
- 请求方法：GET
- 请求参数：`code` - 验证码
- 返回值说明：
  - code: 状态码
  - msg: 提示信息
  - 示例：
    ```json
    { "code": 0, "msg": "验证成功" }
    ```

#### 1.4 完成注册
- 请求路径：`/register2`
- 请求方法：POST
- 请求参数：
  - `data`: 注册数据
  - `inviteUser`: 邀请用户（可选）
- 返回值说明：
  - code: 状态码
  - msg: 提示信息
  - 示例：
    ```json
    { "code": 0, "msg": "注册成功" }
    ```

#### 1.5 获取当前用户信息
- 请求路径：`/api/user`
- 请求方法：GET
- 需要认证：是
- 返回值说明：
  - code: 状态码
  - data: 用户信息对象
  - 示例：
    ```json
    {
      "code": 0,
      "data": {
        "userName": "张三",
        "userAvatar": "https://...",
        ...
      }
    }
    ```

#### 1.6 获取用户背包
- 请求路径：`/user/query/items`
- 请求方法：POST
- 需要认证：是
- 请求参数：
  ```json
  {
    "userName": "用户名"
  }
  ```
- 返回值说明：
  - code: 状态码
  - data: 背包物品列表
  - 示例：
    ```json
    {
      "code": 0,
      "data": [
        { "itemId": 1, "itemName": "道具A", ... }
      ]
    }
    ```

#### 1.7 获取用户资料
- 请求路径：`/user/{username}`
- 请求方法：GET
- 需要认证：是
- 返回值说明：
  - code: 状态码
  - data: 用户资料对象

#### 1.8 更新用户资料
- 请求路径：`/api/user`
- 请求方法：PUT
- 需要认证：是
- 请求参数：用户资料对象
- 返回值说明：
  - code: 状态码
  - msg: 提示信息

#### 1.9 获取活跃度
- 请求路径：`/user/liveness`
- 请求方法：GET
- 需要认证：是
- 返回值说明：
  - code: 状态码
  - data: 活跃度数值
  - 示例：
    ```json
    { "code": 0, "data": 123 }
    ```

#### 1.10 获取最近注册用户
- 请求路径：`/api/user/recentReg`
- 请求方法：GET
- 需要认证：是
- 返回值说明：
  - code: 状态码
  - data: 用户列表

#### 1.11 转账
- 请求路径：`/point/transfer`
- 请求方法：POST
- 需要认证：是
- 请求参数：
  ```json
  {
    "userName": "接收用户名",
    "amount": "金额",
    "memo": "备注"
  }
  ```
- 返回值说明：
  - code: 状态码
  - msg: 提示信息

#### 1.12 关注/取消关注用户
- 关注：`/follow/user` (POST)
- 取消关注：`/unfollow/user` (POST)
- 需要认证：是
- 请求参数：
  ```json
  {
    "followingId": "用户ID"
  }
  ```
- 返回值说明：
  - code: 状态码
  - msg: 提示信息

#### 1.13 上传文件
- 请求路径：`/upload`
- 请求方法：POST
- 需要认证：是
- 请求格式：multipart/form-data
- 请求参数：
  - file[]: 文件（支持jpg, jpeg, png, gif, mp4等格式）
- 返回值说明：
  - code: 状态码
  - data: 上传成功/失败的文件映射
  - 示例：
    ```json
    {
      "code": 0,
      "data": {
        "succMap": { "文件名": "文件URL" },
        "errFiles": []
      }
    }
    ```

### 2. 文章相关接口

#### 2.1 发布文章
- 请求路径：`/article`
- 请求方法：POST
- 需要认证：是
- 请求参数：
  ```json
  {
    "content": "文章内容",
    "title": "文章标题",
    "categoryId": "分类ID"
  }
  ```
- 返回值说明：
  - code: 状态码
  - data: 文章对象或ID

#### 2.2 获取文章列表
- 最近文章：`/api/articles/recent` (GET)
- 点赞文章：`/api/articles/recent/good` (GET)
- 热门文章：`/api/articles/recent/hot` (GET)
- 最近回复：`/api/articles/recent/reply` (GET)
- 请求参数：
  ```json
  {
    "p": "页码",
    "size": "每页数量"
  }
  ```
- 返回值说明：
  - code: 状态码
  - data: 文章列表

#### 2.3 获取用户文章
- 请求路径：`/api/user/{username}/articles`
- 请求方法：GET
- 需要认证：是
- 请求参数：
  ```json
  {
    "p": "页码",
    "size": "每页数量"
  }
  ```
- 返回值说明：
  - code: 状态码
  - data: 文章列表

#### 2.4 文章打赏
- 请求路径：`/article/reward`
- 请求方法：POST
- 需要认证：是
- 请求参数：`articleId` - 文章ID
- 返回值说明：
  - code: 状态码
  - msg: 提示信息

#### 2.5 获取文章详情
- 请求路径：`/api/article/{articleId}`
- 请求方法：GET
- 需要认证：是
- 返回值说明：
  - code: 状态码
  - data: 文章详情对象

#### 2.6 感谢文章
- 请求路径：`/article/thank`
- 请求方法：POST
- 需要认证：是
- 请求参数：`articleId` - 文章ID
- 返回值说明：
  - code: 状态码
  - msg: 提示信息

#### 2.7 评论相关
- 获取评论：`/api/comment/{articleId}` (GET)
  - 返回值说明：
    - code: 状态码
    - data: 评论列表
- 发表评论：`/comment` (POST)
  - 返回值说明：
    - code: 状态码
    - data: 评论对象
- 回复评论：`/comment` (POST)
  - 返回值说明：
    - code: 状态码
    - data: 评论对象
- 感谢评论：`/comment/thank` (POST)
  - 返回值说明：
    - code: 状态码
    - msg: 提示信息
- 点赞评论：`/vote/up/comment` (POST)
  - 返回值说明：
    - code: 状态码
    - msg: 提示信息

### 3. 聊天室相关接口

#### 3.1 获取聊天节点
- 请求路径：`/chat-room/node/get`
- 请求方法：GET
- 需要认证：是
- 返回值说明：
  - code: 状态码
  - data: 节点信息

#### 3.2 获取聊天消息
- 请求路径：`/chat-room/more`
- 请求方法：GET
- 需要认证：是
- 请求参数：`page` - 页码
- 返回值说明：
  - code: 状态码
  - data: 消息列表

#### 3.3 表情相关
- 获取默认表情：`/users/emotions` (GET)
  - 返回值说明：
    - code: 状态码
    - data: 表情列表
- 获取表情包：`/api/cloud/get` (POST)
  - 请求参数：`gameId` - 表情包ID
  - 返回值说明：
    - code: 状态码
    - data: 表情包内容

#### 3.4 消息操作
- 发送消息：`/chat-room/send` (POST)
  - 返回值说明：
    - code: 状态码
    - msg: 提示信息
    - data: 消息对象
- 撤回消息：`/chat-room/revoke/{oId}` (DELETE)
  - 返回值说明：
    - code: 状态码
    - msg: 提示信息
- 打开红包：`/chat-room/red-packet/open` (POST)
  - 返回值说明：
    - code: 状态码
    - data: 红包信息

#### 3.5 私信相关
- 获取私信列表：`/chat/get-list` (GET)
  - 返回值说明：
    - code: 状态码
    - data: 私信列表
- 发送私信：`/chat/send` (POST)
  - 返回值说明：
    - code: 状态码
    - msg: 提示信息
- 获取私信详情：`/chat/get-message` (GET)
  - 返回值说明：
    - code: 状态码
    - data: 私信详情

### 4. 通知相关接口

#### 4.1 获取通知列表
- 请求路径：`/api/getNotifications`
- 请求方法：GET
- 需要认证：是
- 请求参数：
  ```json
  {
    "type": "通知类型",
    "page": "页码"
  }
  ```
- 返回值说明：
  - code: 状态码
  - data: 通知列表

#### 4.2 通知操作
- 已读所有：`/notifications/all-read` (GET)
  - 返回值说明：
    - code: 状态码
    - msg: 提示信息
- 已读类型：`/notifications/make-read/{type}` (GET)
  - 返回值说明：
    - code: 状态码
    - msg: 提示信息
- 标记已读：`/notification/read/{notificationId}` (POST)
  - 返回值说明：
    - code: 状态码
    - msg: 提示信息
- 获取未读数：`/notifications/unread/count` (GET)
  - 返回值说明：
    - code: 状态码
    - data: 未读数量

### 5. 清风明月相关接口

#### 5.1 获取清风明月列表
- 请求路径：`/api/breezemoons`
- 请求方法：GET
- 需要认证：是
- 请求参数：
  ```json
  {
    "p": "页码",
    "size": "每页数量"
  }
  ```
- 返回值说明：
  - code: 状态码
  - data: 清风明月列表

#### 5.2 发布清风明月
- 请求路径：`/breezemoon`
- 请求方法：POST
- 需要认证：是
- 请求参数：
  ```json
  {
    "breezemoonContent": "内容"
  }
  ```
- 返回值说明：
  - code: 状态码
  - msg: 提示信息

#### 5.3 获取用户清风明月
- 请求路径：`/api/user/{username}/breezemoons`
- 请求方法：GET
- 需要认证：是
- 请求参数：
  ```json
  {
    "p": "页码",
    "size": "每页数量"
  }
  ```
- 返回值说明：
  - code: 状态码
  - data: 清风明月列表

### 6. 活动相关接口

#### 6.1 获取活跃度
- 请求路径：`/user/liveness`
- 请求方法：GET
- 需要认证：是
- 返回值说明：
  - code: 状态码
  - data: 活跃度数值

#### 6.2 获取签到状态
- 请求路径：`/user/checkedIn`
- 请求方法：GET
- 需要认证：是
- 返回值说明：
  - code: 状态码
  - data: 签到状态

#### 6.3 领取昨日活跃奖励
- 请求路径：`/activity/yesterday-liveness-reward-api`
- 请求方法：GET
- 需要认证：是
- 返回值说明：
  - code: 状态码
  - msg: 提示信息

#### 6.4 查询奖励状态
- 请求路径：`/api/activity/is-collected-liveness`
- 请求方法：GET
- 需要认证：是
- 返回值说明：
  - code: 状态码
  - data: 是否已领取

## 错误码说明
- code: 0 - 请求成功
- code: -1 - 请求失败（可能是API Key无效或其他错误）

## 注意事项
1. 所有需要认证的接口都需要在请求中携带有效的API Key
2. 文件上传大小限制为20MB
3. 部分接口可能需要特定的权限才能访问
4. 建议定期检查API Key的有效性 