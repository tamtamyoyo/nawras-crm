# Page snapshot

```yaml
- generic [ref=e2]:
  - generic [ref=e5]:
    - generic [ref=e6]:
      - heading "Nawras CRM" [level=1] [ref=e7]
      - paragraph [ref=e8]: Sign in to your account to continue
    - generic [ref=e9]:
      - generic [ref=e10]:
        - heading "Sign In" [level=3] [ref=e11]
        - paragraph [ref=e12]: Enter your email and password to access your account
      - generic [ref=e13]:
        - generic [ref=e14]:
          - generic [ref=e15]:
            - generic [ref=e16]: Email
            - generic [ref=e17]:
              - img [ref=e18]
              - textbox "Enter your email" [ref=e21]: invalid@test.com
          - generic [ref=e22]:
            - generic [ref=e23]: Password
            - generic [ref=e24]:
              - img [ref=e25]
              - textbox "Enter your password" [active] [ref=e28]: wrongpassword
          - button "Sign In" [ref=e29] [cursor=pointer]
        - paragraph [ref=e31]:
          - text: Don't have an account?
          - link "Sign up" [ref=e32] [cursor=pointer]:
            - /url: /register
  - region "Notifications (F8)":
    - list
```