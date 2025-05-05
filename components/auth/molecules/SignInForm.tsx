import { useState } from "react";
import { View, StyleSheet } from "react-native";
import { useAuth } from "../../../context/AuthContext";
import { AuthInput } from "../atoms/AuthInput";
import { AuthButton } from "../atoms/AuthButton";

export function SignInForm() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    try {
      console.log("Submit button pressed, starting sign-in...");
      setLoading(true);

      const result = await signIn({ email, password });
      console.log("Sign-in completed successfully:", result);

      // Don't try to log useAuth() directly here as it's a hook
      // Instead log specific values you need to check
    } catch (error) {
      console.error("Sign-in form submission error:", error);
      // Error handled by AuthContext
    } finally {
      setLoading(false);
    }
  };
  return (
    <View style={styles.container}>
      <View style={styles.inputsContainer}>
        <AuthInput
          value={email}
          onChangeText={setEmail}
          placeholder="Email"
          autoCapitalize="none"
          keyboardType="email-address"
        />
        <AuthInput
          value={password}
          onChangeText={setPassword}
          placeholder="Password"
          secureTextEntry
        />
      </View>

      <View style={styles.buttonPosition}>
        <AuthButton onPress={handleSubmit} loading={loading} title="Sign In" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  inputsContainer: {
    gap: 8,
  },
  buttonPosition: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: "50%",
    paddingHorizontal: 20,
  },
});
