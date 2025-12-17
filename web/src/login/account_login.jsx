import React, { useMemo, useState } from "react";
import ReactDOM from "react-dom";
import { ConfigProvider, Input, Button, Typography, Alert } from "@ones-design/core";

const { Title, Text } = Typography || {};

function useQuery() {
  return useMemo(() => {
    try {
      return new URLSearchParams(window.location.search || "");
    } catch {
      return new URLSearchParams("");
    }
  }, []);
}

const LoginApp = () => {
  const params = useQuery();
  const redirectUrlParam = params.get("redirect_url");
  const orgUUID = params.get("org_uuid");

  const [prefix, setPrefix] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [submitting, setSubmitting] = useState(false);

  const disabled = !redirectUrlParam;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (disabled) {
      setMessage("缺少 redirect_url 参数，无法完成登录流程。");
      setMessageType("error");
      return;
    }

    const value = (prefix || "").trim();
    if (!value) {
      setMessage("请输入名字前缀，例如：Alice、Bob");
      setMessageType("error");
      return;
    }

    try {
      setSubmitting(true);
      const decodedRedirect = decodeURIComponent(redirectUrlParam);
      const target = new URL(decodedRedirect);
      target.searchParams.set("code", value);
      window.location.href = target.toString();
    } catch (error) {
      console.error("构造跳转地址失败", error);
      setMessage("构造跳转地址失败，请稍后重试。");
      setMessageType("error");
      setSubmitting(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: 360,
          padding: "24px 22px 22px",
          borderRadius: 16,
          background: "#ffffff",
          boxShadow: "0 18px 45px rgba(15, 23, 42, 0.24)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 4 }}>
          {Title ? (
            <Title level={4} style={{ marginBottom: 4 }}>
              第三方账号登录
            </Title>
          ) : (
            <h2 style={{ fontSize: 20, fontWeight: 600 }}>第三方账号登录</h2>
          )}
          <Text
            type="secondary"
            style={{ fontSize: 13, color: "#64748b" }}
          >
            输入名字前缀，自动匹配目录中的用户
          </Text>
        </div>

        {orgUUID && (
          <div style={{ marginBottom: 8 }}>
            <Text type="secondary" style={{ fontSize: 12 }}>
              当前组织：{orgUUID}
            </Text>
          </div>
        )}

        {disabled && (
          <div style={{ marginBottom: 12 }}>
            {Alert ? (
              <Alert
                type="error"
                message="缺少 redirect_url 参数，无法完成登录流程。"
                showIcon
              />
            ) : (
              <div
                style={{ fontSize: 12, color: "#b91c1c" }}
              >
                缺少 redirect_url 参数，无法完成登录流程。
              </div>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 6 }}>
            <Text style={{ fontSize: 13 }}>名字前缀</Text>
          </div>
          <Input
            placeholder="例如：Ali、Bob"
            value={prefix}
            onChange={(e) => setPrefix(e?.target?.value ?? "")}
            disabled={disabled || submitting}
          />
          <div
            style={{
              fontSize: 12,
              color: "#64748b",
              marginTop: 4,
              marginBottom: 14,
              lineHeight: 1.5,
            }}
          >
            说明：会在同步的用户目录中查找“名字以该前缀开头”的用户，例如
            &nbsp;
            <code>Ali</code> 可以匹配 <code>Alice Zhang</code>。
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={submitting}
              disabled={disabled}
            >
              登录
            </Button>
          </div>
        </form>

        {message && (
          <div style={{ marginTop: 10 }}>
            {Alert ? (
              <Alert
                type={messageType === "error" ? "error" : "info"}
                message={message}
                showIcon
              />
            ) : (
              <div
                style={{
                  fontSize: 12,
                  color: messageType === "error" ? "#b91c1c" : "#0f766e",
                }}
              >
                {message}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

ReactDOM.render(
  <ConfigProvider>
    <LoginApp />
  </ConfigProvider>,
  document.getElementById("LoginApp")
);
