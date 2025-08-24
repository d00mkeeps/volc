import { BaseApiService } from "./baseService";
import { supabase } from "@/lib/supabaseClient";

interface DeleteAccountConfirmation {
  confirmed: boolean;
  typed_confirmation: string;
}

interface DeleteAccountResponse {
  success: boolean;
  message: string;
  data?: any;
}

export class UserService extends BaseApiService {
  constructor() {
    super("/db");
  }

  async deleteAccount(
    confirmation: DeleteAccountConfirmation
  ): Promise<DeleteAccountResponse> {
    try {
      const result = await this.post<DeleteAccountResponse>(
        "/account/delete",
        confirmation
      );

      if (result.success) {
        await supabase.auth.signOut();
      }

      return result;
    } catch (error) {
      this.handleError(error);
    }
  }
}

export const userService = new UserService();
