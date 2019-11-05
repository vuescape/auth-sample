<template>
  <span>
    <transition
      v-if="!isAuthenticated"
      name="component-fade"
      mode="out-in"
    >
      <v-form
        v-loading="isSpinning"
        ref="signInForm"
        label="Sign In"
        @keyup.enter.native="signIn"
        v-show="!isAuthenticated"
        v-model="isValid"
        label-position="left"
        label-width="0px"
        class="sign-in__form"
      >
        <h2>Sign In</h2>
        <v-alert
          v-if="moduleState.notifications.length > 0"
          class="caption sign-in__alert"
          transition="fade-transition"
          :value="moduleState.notifications.length > 0"
          :type="moduleState.notifications[0].type"
          outline
          dismissible
          @click="notificationClosed(moduleState.notifications[0].key)"
        >
          {{moduleState.notifications[0].message}}
        </v-alert>
        <p />
        <v-text-field
          :rules="signInRules.username"
          v-model="credentials.username"
          label="Username"
          required
          :autofocus="true"
        ></v-text-field>
        <v-text-field
          :rules="signInRules.password"
          v-model="credentials.password"
          type="password"
          label="Password"
          required
        ></v-text-field>
        <v-btn
          class="sign-in__btn"
          :disabled="!isValid || moduleState.isPending"
          @click="signIn"
          depressed
          color="primary"
        >Sign In</v-btn>
      </v-form>
    </transition>

  </span>
</template>
<script lang="ts">
import Component from 'vue-class-component'
import { Action, State } from 'vuex-class'

import { AuthenticationInfo, AuthenticationStore, Credentials } from '../../store/modules/Authentication'

import ComponentBase from '@vuescape/infrastructure/ComponentBase'
import { AuthenticationModuleName, AuthenticationOperation } from '@vuescape/store/modules/Authentication'
import { ModuleState, ns } from '@vuescape/store/modules/types/'
import { UserProfileModuleName, UserProfileOperation } from '@vuescape/store/modules/UserProfile'
import { registerDynamicModule } from '@vuescape/store/registerDynamicModule'

@Component
export default class SignIn extends ComponentBase {
  private signInRules = {
    username: [(v: string) => !!v || 'Please enter your Username'],
    password: [(v: string) => !!v || 'Please enter your Password'],
  }
  private isValid = false
  private isSpinning = false
  private credentials: Credentials = { username: 'eve.holt@reqres.in', password: '' }

  @State private isAuthenticated: boolean

  @State(AuthenticationModuleName) private moduleState: ModuleState<AuthenticationInfo, Credentials>
  @Action(ns(AuthenticationModuleName, AuthenticationOperation.Action.SIGN_IN_WITH_CREDENTIALS))
  private signInWithCredentials: any
  @Action(ns(AuthenticationModuleName, AuthenticationOperation.Action.NotificationActions.REMOVE))
  private removeNotification: any

  private async signIn() {
    const form: any = this.$refs.signInForm
    if (form.validate()) {
      this.isSpinning = true
      await this.signInWithCredentials(this.credentials)
      this.redirectIfAuthenticated()
      this.isSpinning = false
    }
  }

  private redirectIfAuthenticated() {
    if (this.isAuthenticated) {
      this.credentials.username = ''
      this.credentials.password = ''
      // Add 'as string' to avoid compile error matching types in $router.push
      const redirect = (this.$route.query.redirect || '/') as string
      this.$router.push(redirect)
    }
  }

  private mounted() {
    this.redirectIfAuthenticated()
  }

  private created() {
    registerDynamicModule(AuthenticationModuleName, () => new AuthenticationStore(), this.$store)
  }

  private async notificationClosed(notificationKey: string) {
    await this.removeNotification(notificationKey)
  }
}
</script>
<style lang="css">
.sign-in__btn {
  width: 100%;
  margin: 0px;
}
.sign-in__form {
  -webkit-border-radius: 5px;
  border-radius: 5px;
  -moz-border-radius: 5px;
  background-clip: padding-box;
  margin: 80px auto;
  width: 350px;
  padding: 35px 35px 15px 35px;
  background: #fff;
  border: 1px solid #ade3ef;
}
.sign-in__alert {
  margin-top: 1em;
}
</style>
