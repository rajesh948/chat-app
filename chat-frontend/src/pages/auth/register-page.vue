<template>
  <div class="container">
    <div class="login form">
      <header>{{ title }}</header>
      <span class="signup">{{ errorMessage }}</span>
      <form @submit.prevent="onFormSubmit">
        <input
          type="text"
          v-if="isShowSignupForm"
          v-model="user.name"
          placeholder="Enter your Name"
        />
        <input
          type="text"
          v-model="user.email"
          placeholder="Enter your email"
        />
        <input
          type="password"
          v-model="user.password"
          placeholder="Enter your password"
        />

        <a v-if="isShowSignupForm" href="#">Forgot password?</a>
        <input type="submit" class="button" :value="title" />
      </form>
      <div class="signup">
        <span v-if="isShowSignupForm" class="signup"
          >Already have an account?
          <label @click="toggleSignup" for="check">Login</label>
        </span>
        <span v-else class="signup"
          >Don't have an account?
          <label @click="toggleSignup" for="check">Signup</label>
        </span>
      </div>
    </div>
  </div>
</template>
<script>
import { ref } from "vue";
import { useRouter } from "vue-router";
import { socket } from "@/plugins/socket/socket.js";
export default {
  setup() {
    const user = ref({
      name: null,
      email: null,
      password: null,
    });
    if (socket.id) {
      router.push({ name: "chatting" });
    }
    const router = useRouter();
    const errorMessage = ref(null);
    const title = ref("Login");
    const isShowSignupForm = ref(false);
    const toggleSignup = () => {
      errorMessage.value = null;
      user.value = {
        name: null,
        email: null,
        password: null,
      };
      isShowSignupForm.value = !isShowSignupForm.value;
      title.value = isShowSignupForm.value ? "Register" : "Login";
    };

    const onFormSubmit = () => {
      socket.connect();
      isShowSignupForm.value
        ? socket.emit("register", user.value)
        : socket.emit("login", user.value);

      socket.on("already-exist", (error) => {
        if (error) {
          errorMessage.value = error.message;
        } else {
          router.push({ name: "chatting" });
        }
      });
    };

    return {
      user,
      toggleSignup,
      isShowSignupForm,
      title,
      onFormSubmit,
      errorMessage,
    };
  },
};
</script>
<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: "Poppins", sans-serif;
}
body {
  min-height: 100vh;
  width: 100%;
  background: #009579;
}
.container {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  max-width: 430px;
  width: 100%;
  background: #fff;
  border-radius: 7px;
  box-shadow: 0 5px 10px rgba(0, 0, 0, 0.3);
}

.container .form {
  padding: 2rem;
}
.form header {
  font-size: 2rem;
  font-weight: 500;
  text-align: center;
  margin-bottom: 1.5rem;
}
.form input {
  height: 60px;
  width: 100%;
  padding: 0 15px;
  font-size: 17px;
  margin-bottom: 1.3rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  outline: none;
}
.form input:focus {
  box-shadow: 0 1px 0 rgba(0, 0, 0, 0.2);
}
.form a {
  font-size: 16px;
  color: #009579;
  text-decoration: none;
}
.form a:hover {
  text-decoration: underline;
}
.form input.button {
  color: #fff;
  background: #009579;
  font-size: 1.2rem;
  font-weight: 500;
  letter-spacing: 1px;
  margin-top: 1.7rem;
  cursor: pointer;
  transition: 0.4s;
}
.form input.button:hover {
  background: #006653;
}
.signup {
  font-size: 17px;
  text-align: center;
}
.signup label {
  color: #009579;
  cursor: pointer;
}
.signup label:hover {
  text-decoration: underline;
}
</style>
