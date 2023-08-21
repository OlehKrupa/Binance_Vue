import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { csrfCookie, login, register, logout, getUser, unPremium } from "../http/auth-api";
import { now } from "d3";

export const useAuthStore = defineStore("authStore", () => {
  const user = ref(null);
  const errors = ref({});

  const isSubscribed = computed(() => user.value && user.value.subscribed_at);
  const isPremium = computed(() => user.value && user.value.premium_at);

  const isLoggedIn = computed(() => !!user.value);

  const fetchUser = async () => {
    try {
      const { data } = await getUser();
      user.value = data;
      var millisecondsPerDay = 24 * 60 * 60 * 1000;
      var daysDiff = Math.floor(Math.abs(new Date(user.value.premium_at) - new Date(Date.now())) / millisecondsPerDay)
      if (daysDiff>=31){
        unPremium();
      }
    } catch (error) {
      user.value = null;
    }
  };

  const handleCancelPremium = async () => {
    unPremium();
    fetchUser();
  }

  const handleLogin = async (credentials) => {
    await csrfCookie();
    try {
      await login(credentials);
      await fetchUser();
      errors.value = {};
    } catch (error) {
      if (error.response && error.response.status === 422) {
        errors.value = error.response.data.errors;
      }
    }
  };

  const handleRegister = async (newUser) => {

    try {
      await register(newUser);
      await handleLogin({
        email: newUser.email,
        password: newUser.password,
      });
    } catch (error) {
      if (error.response && error.response.status === 422) {
        errors.value = error.response.data.errors;
      }
    }
  };

  const handleLogout = async () => {
    await logout();
    user.value = null;
  };

  return {
    user,
    errors,
    isLoggedIn,
    isSubscribed,
    isPremium,
    fetchUser,
    handleCancelPremium,
    handleLogin,
    handleRegister,
    handleLogout,
  };
});
