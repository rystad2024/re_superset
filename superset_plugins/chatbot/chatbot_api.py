from flask import request, jsonify, current_app
from superset.views.base_api import BaseSupersetApi, expose
import requests
import os


class ChatbotApi(BaseSupersetApi):
    resource_name = "chatbot"
    openapi_spec_tag = "Chatbot"

    @expose("/", methods=["POST"])
    def post(self):
        """
        Proxy endpoint to communicate with the external chatbot API.
        """
        # Debug: Print available config keys
        print("Available config keys:", [key for key in current_app.config.keys() if 'CHATBOT' in key])
        print("CHATBOT_API_URL value:", current_app.config.get("CHATBOT_API_URL"))

        data = request.json or {}

        # Use 'msg' because backend expects it
        user_message = data.get("msg")
        if not user_message:
            return jsonify({"error": "No message provided"}), 400

        # Get backend URL from config or env
        chatbot_url = current_app.config.get("CHATBOT_API_URL") or os.getenv("CHATBOT_API_URL")
        if not chatbot_url:
            return jsonify({"error": "Chatbot API URL not configured"}), 500

        # Build payload for backend
        payload = {
            "session_id": data.get("session_id") or "superset-session",
            "msg": user_message,
            "document_source": data.get("document_source") or "analytics",
            "skip_answer": data.get("skip_answer", False),
        }

        print(f"➡️ Forwarding payload to backend: {payload}")

        try:
            headers = {}
            api_key = current_app.config.get("CHATBOT_API_KEY") or os.getenv("CHATBOT_API_KEY")
            if api_key:
                headers["Authorization"] = f"Bearer {api_key}"

            resp = requests.post(
                chatbot_url,
                headers=headers,
                json=payload,
                timeout=30,
            )
            resp.raise_for_status()
            return jsonify(resp.json())
        except requests.exceptions.RequestException as e:
            # Log the full response if available
            response_text = getattr(e.response, "text", None)
            print(f"❌ Backend request failed: {e}, response: {response_text}")
            return jsonify({"error": f"Failed to connect to chatbot API: {e}"}), 500
