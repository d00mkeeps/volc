import { useState, useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { useAuth } from "../../../context/AuthContext";
import { AuthInput } from "../atoms/AuthInput";
import { AuthButton } from "../atoms/AuthButton";
import { SystemMessage } from "../../atoms/SystemMessage";

export function SignUpForm() {
  const { signUp } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const clearForm = () => {
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  };
  const clearPasswords = () => {
    setPassword("");
    setConfirmPassword("");
  };

  // Auto-clear success message after 5 seconds
  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => setSuccess(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  const handleSubmit = async () => {
    const cleanEmail = email.trim().toLowerCase().replace(/\s+/g, "");
    if (password !== confirmPassword) {
      // Handle password mismatch
      return;
    }

    try {
      setLoading(true);
      setSuccess(false);

      await signUp({ email: cleanEmail, password });

      clearForm();
      setSuccess(true);
    } catch (error) {
      setSuccess(false);
      clearPasswords();
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {success && (
        <SystemMessage
          message="Account created! Please check your email to verify your account before signing in."
          type="success"
        />
      )}

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
        <AuthInput
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          placeholder="Confirm Password"
          secureTextEntry
        />
      </View>

      <View style={styles.buttonPosition}>
        <AuthButton onPress={handleSubmit} loading={loading} title="Sign Up" />
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
