<template>
  <div id="container">
    <aside>
      <header>
        <li v-if="loginUser">
          <div class="user-logo">{{ loginUser.name.substr(0, 1) }}</div>
          <div>
            <h2>{{ loginUser.name }}</h2>
            <h3>
              <span class="status green"></span>
              online
            </h3>
          </div>
          <div><button @click="toggleGroupForm">Create Group</button></div>
        </li>
      </header>
      <ul>
        <li
          v-for="user in users"
          :key="user.email"
          @click="onToggleUserMessagePanel(user.name)"
        >
          <div class="user-logo">{{ user.name.substr(0, 1) }}</div>
          <div>
            <h2>{{ user.name }}</h2>
            <div v-if="user.tag === 'group'">
              <h3>
                <span class="status green"></span>
                group
              </h3>
            </div>
            <div v-else>
              <h3 v-if="user.active">
                <span class="status green"></span>
                online
              </h3>
              <h3 v-else>
                <span class="status orange"></span>
                offline
              </h3>
            </div>
          </div>
          <div class="typing-text" v-if="!selectedUser?.type && user?.type">
            typing....
          </div>
          <svg-icon
            v-if="user.isShowAlert"
            style="color: #009579"
            type="mdi"
            :path="imgPath"
          ></svg-icon>
        </li>
      </ul>
    </aside>
    <main v-if="selectedUser">
      <header>
        <div class="user-logo">{{ selectedUser.name?.substr(0, 1) }}</div>
        <div>
          <h2>{{ selectedUser.name }}</h2>
          <div v-if="selectedUser?.type" class="typing-text">typing....</div>
          <div v-else>
            <div v-if="selectedUser.tag === 'group'">
              <h3>
                <span class="status green"></span>
                group
              </h3>
            </div>
            <div v-else>
              <h3 v-if="selectedUser.active">
                <span class="status green"></span>
                online
              </h3>
              <h3 v-else>
                <span class="status orange"></span>
                offline
              </h3>
            </div>
          </div>
        </div>
      </header>
      <ul id="chat" v-if="conversation?.length">
        <li
          v-for="msg in conversation"
          :key="msg.text"
          :class="msg.own === loginUser.name ? 'me' : 'you'"
        >
          <div class="entete">
            <span class="status green"></span>
            <h2 v-if="selectedUser.tag === 'group'">{{ msg.own }}</h2>
            <h3>10:12AM, Today</h3>
          </div>
          <div class="message">
            {{ msg.text }}
          </div>
        </li>
      </ul>
      <footer>
        <textarea
          @input="displayTyping"
          v-model="inputMessage"
          placeholder="Type your message"
        ></textarea>
        <a @click="sendMessage">Send</a>
      </footer>
    </main>
    <popUpBox v-if="isShowBox" @closePopUpBox="toggleGroupForm">
      <template v-slot:header> Create New Group </template>
      <template v-slot:content>
        <div class="form">
          <label>Group Name:</label>
          <input type="text" v-model="groupName" />
          <div v-for="user in users" :key="user.name">
            <div class="friend-box" v-if="user.tag !== 'group'">
              <div class="friend-name">
                <p>{{ user.name }}</p>
              </div>
              <div class="friend-btn">
                <button @click="addUserToGroup(user)">
                  {{ getBTNTitle(user.name) }}
                </button>
                <!-- <button @click="deleteUser(index)">Delete</button> -->
              </div>
            </div>
          </div>
        </div>
      </template>
      <template v-slot:footer>
        <div class="footer-btn">
          <button @click="createGroup">Create</button>
        </div>
      </template>
    </popUpBox>
  </div>
</template>
<script>
import { socket } from "@/plugins/socket/socket";
import SvgIcon from "@jamescoyle/vue-icon";
import { mdiChatAlert } from "@mdi/js";
import popUpBox from "@/components/ui/pop-up-box.vue";
import { ref } from "vue";
import { useRouter } from "vue-router";
export default {
  components: {
    SvgIcon,
    popUpBox,
  },
  setup() {
    const imgPath = mdiChatAlert;
    const router = useRouter();
    const loginUser = ref(null);
    const selectedUser = ref(null);
    const conversation = ref([]);
    const inputMessage = ref(null);
    const users = ref(null);
    if (!socket.id) {
      router.push({ name: "home" });
    }

    socket.on("login-user", (user) => {
      loginUser.value = user;
    });

    socket.on("users", (data) => {
      console.log("users:::", data);
      users.value = data.filter((u) => u.name !== loginUser.value.name);
    });
    socket.on("connected user", (user) => {
      if (users.value) users.value.push(user);
    });
    socket.on("reconnected user", (userName) => {
      if (users.value)
        users.value.forEach((user) => {
          if (user.name === userName) {
            user.active = true;
          }
        });
    });

    socket.on("disconnect user", (userName) => {
      if (users.value)
        users.value.forEach((user) => {
          if (user.name === userName) {
            user.active = false;
          }
        });
    });
    const onToggleUserMessagePanel = (userName) => {
      selectedUser.value = users.value.find((user) => user.name === userName);

      users.value.forEach((user) => {
        if (user.name === userName) {
          user.isShowAlert = false;
        }
      });
      socket.emit("get conversation", {
        from: loginUser.value.name,
        to: selectedUser.value.name,
      });
    };

    socket.on("get conversation", (data) => {
      conversation.value = data?.message || [];
    });

    const sendMessage = () => {
      conversation.value.push({
        own: loginUser.value.name,
        text: inputMessage.value,
      });

      socket.emit("private message", {
        from: loginUser.value.name,
        to: selectedUser.value.name,
        message: { own: loginUser.value.name, text: inputMessage.value },
      });

      inputMessage.value = null;
    };

    socket.on("private-message", ({ message, senderName }) => {
      conversation.value.push(message);
      console.log("on private msg:::", selectedUser.value);
      if (selectedUser?.value?.name !== senderName) {
        users.value.forEach((user) => {
          if (user.name === senderName) {
            user.isShowAlert = true;
          }
        });
      }
      console.log(conversation.value);
    });
    let flag = true;
    let timeOut;
    const displayTyping = () => {
      if (flag) {
        socket.emit("typing", { to: selectedUser.value.name, type: true });
        flag = false;
      }
      clearTimeout(timeOut);
      timeOut = setTimeout(() => {
        socket.emit("typing", { to: selectedUser.value.name, type: false });
        flag = true;
      }, 800);
    };

    socket.on("typing", ({ typierName, isTyping }) => {
      users.value.forEach((user) => {
        if (user.name === typierName) {
          user.type = isTyping;
        }
      });

      if (selectedUser.value?.name === typierName) {
        selectedUser.value.type = isTyping;
      }
    });

    // group functionality

    const isShowBox = ref(false);
    const groupName = ref(null);
    const groupUsers = ref([]);
    const toggleGroupForm = () => {
      groupName.value = null;
      groupUsers.value = [];
      isShowBox.value = !isShowBox.value;
    };
    const addUserToGroup = (user) => {
      const index = groupUsers.value.findIndex(
        (userName) => userName === user.name
      );
      index === -1
        ? groupUsers.value.push(user.name)
        : groupUsers.value.splice(index, 1);
    };

    const createGroup = () => {
      const group = {
        id: Date.now(),
        members: groupUsers.value,
        name: groupName.value,
        createBy: loginUser.value.name,
        tag: "group",
      };
      socket.emit("create group", group);
      users.value.push(group);
      toggleGroupForm();
    };
    const getBTNTitle = (userName) => {
      return groupUsers.value.find((name) => name === userName)
        ? "Remove"
        : "Add";
    };

    socket.on("create group", (group) => {
      socket.emit("join group", group.name);
      users.value.push(group);
    });

    return {
      users,
      onToggleUserMessagePanel,
      selectedUser,
      sendMessage,
      inputMessage,
      conversation,
      loginUser,
      displayTyping,
      imgPath,
      isShowBox,
      toggleGroupForm,
      groupName,
      addUserToGroup,
      getBTNTitle,
      createGroup,
    };
  },
};
</script>

<style scoped>
* {
  box-sizing: border-box;
}

#container {
  font-family: Arial;
  display: flex;
  font-size: 0;
  border-radius: 5px;
}
.typing-text {
  color: #58b666;
  font-size: medium;
  font-weight: 600;
}
aside {
  width: 350px;
  background-color: #3b3e49;
  font-size: 15px;
}
main {
  width: 900px;
  font-size: 15px;
}

aside header {
  padding: 30px 10px;
}
aside input {
  width: 100%;
  height: 50px;
  line-height: 50px;
  padding: 0 50px 0 20px;
  background-color: #5e616a;
  border: none;
  border-radius: 3px;
  color: #fff;
  background-image: url(https://s3-us-west-2.amazonaws.com/s.cdpn.io/1940306/ico_search.png);
  background-repeat: no-repeat;
  background-position: 170px;
  background-size: 40px;
}
aside input::placeholder {
  color: #fff;
}
aside ul {
  padding-left: 0;
  margin: 0;
  list-style-type: none;
  overflow-y: scroll;
  height: 690px;
}
aside li {
  padding: 10px 0;
}
aside li:hover {
  background-color: #5e616a;
}
h2,
h3 {
  margin: 0;
}
aside li img,
.user-logo {
  background-color: #009579;
  border-radius: 50%;
  font-size: larger;
  font-weight: 600;
  color: white;
  padding: 11px 17px;
  margin-left: 20px;
  margin-right: 8px;
}
aside li div {
  display: inline-block;
  vertical-align: top;
  margin-top: 12px;
}
aside li h2 {
  font-size: 14px;
  color: #fff;
  font-weight: normal;
  margin-bottom: 5px;
}
aside li h3 {
  font-size: 12px;
  color: #7e818a;
  font-weight: normal;
}

.status {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  display: inline-block;
  margin-right: 7px;
}
.green {
  background-color: #58b666;
}
.orange {
  background-color: #ff725d;
}
.blue {
  background-color: #6fbced;
  margin-right: 0;
  margin-left: 7px;
}

main header {
  height: 110px;
  padding: 30px 20px 30px 40px;
}
main header > * {
  display: inline-block;
  vertical-align: top;
}
main header img:first-child {
  border-radius: 50%;
}
main header img:last-child {
  width: 24px;
  margin-top: 8px;
}
main header div {
  margin-left: 10px;
  margin-right: 145px;
}
main header h2 {
  font-size: 16px;
  margin-bottom: 5px;
}
main header h3 {
  font-size: 14px;
  font-weight: normal;
  color: #7e818a;
}

#chat {
  padding-left: 0;
  margin: 0;
  list-style-type: none;
  overflow-y: scroll;
  height: 535px;
  border-top: 2px solid #fff;
  border-bottom: 2px solid #fff;
}
#chat li {
  padding: 10px 30px;
}
#chat h2,
#chat h3 {
  display: inline-block;
  font-size: 13px;
  font-weight: normal;
}
#chat h3 {
  color: #bbb;
}
#chat .entete {
  margin-bottom: 5px;
}
#chat .message {
  padding: 20px;
  color: #fff;
  line-height: 25px;
  max-width: 90%;
  display: inline-block;
  text-align: left;
  border-radius: 5px;
}
#chat .me {
  text-align: right;
}
#chat .you .message {
  background-color: #58b666;
}
#chat .me .message {
  background-color: #6fbced;
}
#chat .triangle {
  width: 0;
  height: 0;
  border-style: solid;
  border-width: 0 10px 10px 10px;
}
#chat .you .triangle {
  border-color: transparent transparent #58b666 transparent;
  margin-left: 15px;
}
#chat .me .triangle {
  border-color: transparent transparent #6fbced transparent;
  margin-left: 375px;
}

main footer {
  height: 155px;
  padding: 20px 30px 10px 20px;
}
main footer textarea {
  resize: none;
  border: none;
  display: block;
  width: 100%;
  height: 80px;
  border-radius: 3px;
  padding: 20px;
  font-size: 13px;
  margin-bottom: 13px;
}
main footer textarea::placeholder {
  color: #ddd;
}
main footer img {
  height: 30px;
  cursor: pointer;
}
main footer a {
  text-decoration: none;
  text-transform: uppercase;
  font-weight: bold;
  color: #6fbced;
  vertical-align: top;
  margin-left: 333px;
  margin-top: 5px;
  display: inline-block;
}

/* pop-up box css */
.form {
  width: 400px;
  display: flex;
  flex-direction: column;
  text-align: left;
}

input {
  padding: 5px;
}
label {
  margin: 10px 0;
}
button {
  padding: 5px;
  font-size: 1rem;
  background-color: #58b666;
  /* width: 100px; */
  border: none;
  border-radius: 4px;
  color: white;
  margin: 0 5px;
  box-shadow: rgba(60, 64, 67, 0.3) 0px 1px 2px 0px,
    rgba(60, 64, 67, 0.15) 0px 1px 3px 1px;
}

.friend-box {
  margin: 5px 0;
  border: 1px solid;
  display: flex;
  align-items: center;
  justify-content: space-around;
}
.friend-name {
  width: 30%;
}
.friend-name p {
  font-size: 1.2rem;
  text-transform: capitalize;
}
</style>
