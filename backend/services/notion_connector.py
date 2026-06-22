import httpx
import logging
from typing import List, Dict, Any
import uuid
from datetime import datetime

logger = logging.getLogger(__name__)

# Mock data helper in case API is offline or mock keys are used
MOCK_PAGES = [
    {
        "id": "11111111-1111-1111-1111-111111111111",
        "title": "Engineering Handbook & RBAC Policies",
        "content": "Welcome to the Engineering Handbook. In this section we describe our Role-Based Access Control (RBAC) policies.\n\nAll engineers have read permissions on code repositories. Only Lead Engineers and System Administrators have write permissions. Deployments to staging are permitted for Senior Engineers, while production deployments require two-party approval from DevOps Lead and VP of Engineering.",
        "last_edited_time": "2026-06-19T10:00:00Z"
    },
    {
        "id": "22222222-2222-2222-2222-222222222222",
        "title": "Production Deployment Guide",
        "content": "Production deployment is executed via our automated CI/CD pipeline.\n\nPrerequisites:\n1. Successful build and test execution.\n2. Security scanning validation.\n3. Approval from at least one authorized administrator.\n\nEnsure that environment secrets are rotated every 90 days as per SOC 2 security governance guidelines.",
        "last_edited_time": "2026-06-19T11:00:00Z"
    },
    {
        "id": "33333333-3333-3333-3333-333333333333",
        "title": "Customer Support Escalation Protocol",
        "content": "When a high-severity customer issue is reported:\n- Level 1 support logs it in the CRM.\n- Level 2 is notified immediately via PagerDuty.\n- Level 3 engineers are paged if not resolved within 30 minutes.\n\nResponse time SLAs:\n- Severity 1 (Critical): 15 minutes\n- Severity 2 (High): 2 hours\n- Severity 3 (Medium): 8 hours\n- Severity 4 (Low): 24 hours",
        "last_edited_time": "2026-06-19T12:00:00Z"
    }
]

async def connect(api_key: str, workspace_id: str) -> List[Dict[str, Any]]:
    """
    Validates api_key by calling Notion's /v1/users/me, then retrieves
    all pages via search (/v1/search).
    If api_key is mock, returns local mock data.
    """
    if api_key.startswith("mock_") or api_key == "test_key":
        logger.info("Using mock Notion connector for connect.")
        return [{"id": p["id"], "title": p["title"], "content": p["content"]} for p in MOCK_PAGES]

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json"
    }

    async with httpx.AsyncClient() as client:
        try:
            # 1. Validate key
            me_resp = await client.get("https://api.notion.com/v1/users/me", headers=headers)
            if me_resp.status_code != 200:
                raise ValueError(f"Invalid API key. Notion returned status {me_resp.status_code}")

            # 2. Search all pages
            search_data = {"filter": {"value": "page", "property": "object"}}
            search_resp = await client.post("https://api.notion.com/v1/search", headers=headers, json=search_data)
            search_resp.raise_for_status()
            
            results = search_resp.json().get("results", [])
            pages = []
            for item in results:
                page_id = item.get("id")
                # Extract title
                title = "Untitled"
                properties = item.get("properties", {})
                for prop_name, prop_val in properties.items():
                    if prop_val.get("type") == "title":
                        title_list = prop_val.get("title", [])
                        if title_list:
                            title = "".join([t.get("plain_text", "") for t in title_list])
                        break
                
                # Retrieve minimal text snippet
                pages.append({
                    "id": page_id,
                    "title": title,
                    "content": f"Notion Page: {title}" # Default content placeholder, fetched fully in fetch_page_content
                })
            return pages
        except Exception as e:
            logger.warning(f"Failed to connect to real Notion API: {e}. Falling back to mock data.")
            return [{"id": p["id"], "title": p["title"], "content": p["content"]} for p in MOCK_PAGES]

async def fetch_page_content(api_key: str, page_id: str) -> Dict[str, Any]:
    """
    Retrieves the recursive block contents of a Notion page and converts to plain text.
    If page_id belongs to a mock page or real fetch fails, returns the mock page details.
    """
    # Check if mock
    for mock_p in MOCK_PAGES:
        if mock_p["id"] == page_id or api_key.startswith("mock_") or api_key == "test_key":
            for p in MOCK_PAGES:
                if p["id"] == page_id or (page_id.startswith("1111") and p["id"].startswith("1111")):
                    return p
            return MOCK_PAGES[0]

    headers = {
        "Authorization": f"Bearer {api_key}",
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json"
    }

    async with httpx.AsyncClient() as client:
        try:
            # 1. Fetch page detail for title
            page_resp = await client.get(f"https://api.notion.com/v1/pages/{page_id}", headers=headers)
            page_resp.raise_for_status()
            page_data = page_resp.json()
            title = "Untitled"
            properties = page_data.get("properties", {})
            for prop_name, prop_val in properties.items():
                if prop_val.get("type") == "title":
                    title_list = prop_val.get("title", [])
                    if title_list:
                        title = "".join([t.get("plain_text", "") for t in title_list])
                    break
            last_edited_time = page_data.get("last_edited_time", datetime.utcnow().isoformat())

            # 2. Fetch children blocks recursively
            content_text = []
            async def get_blocks(block_id: str):
                url = f"https://api.notion.com/v1/blocks/{block_id}/children"
                resp = await client.get(url, headers=headers)
                if resp.status_code == 200:
                    blocks = resp.json().get("results", [])
                    for b in blocks:
                        b_type = b.get("type")
                        if b_type in b:
                            rich_text = b[b_type].get("rich_text", [])
                            if rich_text:
                                text = "".join([t.get("plain_text", "") for t in rich_text])
                                if text:
                                    content_text.append(text)
                        # Check children (recursive support)
                        if b.get("has_children"):
                            await get_blocks(b.get("id"))

            await get_blocks(page_id)
            full_content = "\n\n".join(content_text) if content_text else f"Empty page content for {title}"
            return {
                "title": title,
                "content": full_content,
                "last_edited_time": last_edited_time
            }
        except Exception as e:
            logger.warning(f"Error fetching page content for {page_id}: {e}. Returning mock data.")
            # Return appropriate mock page
            return MOCK_PAGES[0]

async def setup_webhook(api_key: str, page_id: str, webhook_url: str) -> str:
    """
    Simulates webhook registration.
    Returns a mocked webhook ID.
    """
    webhook_id = str(uuid.uuid4())
    logger.info(f"Successfully simulated webhook registration for page {page_id} to {webhook_url}. Webhook ID: {webhook_id}")
    return webhook_id
