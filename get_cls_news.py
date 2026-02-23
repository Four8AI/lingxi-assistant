import requests
from bs4 import BeautifulSoup
from datetime import datetime
import json
import re

HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9',
    'Referer': 'https://www.cls.cn/',
    'Accept-Encoding': 'gzip, deflate',
    'Connection': 'keep-alive',
}

def get_cls_news():
    """
    获取财联社新闻
    注意：由于财联社使用Next.js动态渲染，此方法可能无法获取完整内容
    建议使用Selenium或Playwright等工具获取动态内容
    """
    try:
        # 方法1: 尝试直接获取页面
        response = requests.get('https://www.cls.cn/depth?id=1000', headers=HEADERS, timeout=10)
        response.raise_for_status()
        response.encoding = 'utf-8'
        
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # 方法2: 从script标签中提取数据
        scripts = soup.find_all('script')
        news_list = []
        
        for script in scripts:
            if script.string and ('"props"' in script.string or 'telegraphList' in script.string):
                # 尝试提取JSON数据
                try:
                    # 查找JSON对象
                    json_match = re.search(r'({[^{}]*"telegraphList"[^{}]*})', script.string)
                    if json_match:
                        json_str = json_match.group(1)
                        data = json.loads(json_str)
                        
                        # 提取新闻列表
                        if 'telegraphList' in data:
                            for item in data['telegraphList']:
                                if item:  # 过滤空值
                                    news_list.append({
                                        'title': item.get('title', ''),
                                        'brief': item.get('brief', ''),
                                        'link': f"https://www.cls.cn/telegraph/{item.get('id', '')}" if item.get('id') else '',
                                        'time': item.get('time', ''),
                                        'read_count': item.get('read_count', 0),
                                    })
                except:
                    pass
        
        # 方法3: 如果没有找到数据，尝试查找HTML中的新闻链接
        if not news_list:
            links = soup.find_all('a', href=re.compile(r'/telegraph/\d+'))
            for link in links[:20]:
                title = link.get_text(strip=True)
                href = link.get('href', '')
                if title and href:
                    if not href.startswith('http'):
                        href = 'https://www.cls.cn' + href
                    news_list.append({
                        'title': title,
                        'link': href,
                        'brief': '',
                        'time': '',
                        'read_count': 0,
                    })
        
        return news_list
    
    except Exception as e:
        print(f"获取新闻出错: {e}")
        import traceback
        traceback.print_exc()
        return []

def print_news(news_list):
    """打印新闻列表"""
    print(f"\n{'='*80}")
    print(f"财联社头条新闻 - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"{'='*80}\n")
    
    for idx, news in enumerate(news_list, 1):
        print(f"{idx}. {news['title']}")
        if news['brief']:
            print(f"   摘要: {news['brief'][:150]}...")
        if news['time']:
            print(f"   时间: {news['time']}")
        if news['read_count']:
            print(f"   阅读量: {news['read_count']}")
        if news['link']:
            print(f"   链接: {news['link']}")
        print()

def get_cls_news_selenium():
    """
    使用Selenium获取财联社新闻（需要安装selenium和chromedriver）
    这是获取动态渲染页面的推荐方法
    """
    try:
        from selenium import webdriver
        from selenium.webdriver.chrome.options import Options
        from selenium.webdriver.common.by import By
        import time
        
        chrome_options = Options()
        chrome_options.add_argument('--headless')
        chrome_options.add_argument('--no-sandbox')
        chrome_options.add_argument('--disable-dev-shm-usage')
        chrome_options.add_argument('--window-size=1920,1080')
        chrome_options.add_argument('user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36')
        
        driver = webdriver.Chrome(options=chrome_options)
        driver.get('https://www.cls.cn/depth?id=1000')
        
        # 等待页面加载
        time.sleep(5)
        
        # 获取页面源码
        page_source = driver.page_source
        driver.quit()
        
        soup = BeautifulSoup(page_source, 'html.parser')
        
        # 查找新闻元素
        news_list = []
        news_items = soup.find_all('a', href=re.compile(r'/telegraph/\d+'))
        
        for item in news_items[:20]:
            title = item.get_text(strip=True)
            link = item.get('href', '')
            
            if title and link:
                if not link.startswith('http'):
                    link = 'https://www.cls.cn' + link
                
                news_list.append({
                    'title': title,
                    'link': link,
                    'brief': '',
                    'time': '',
                    'read_count': 0,
                })
        
        return news_list
    
    except ImportError:
        print("未安装selenium，请使用: pip install selenium")
        return []
    except Exception as e:
        print(f"Selenium出错: {e}")
        return []

if __name__ == "__main__":
    print("方法1: 使用requests获取新闻...")
    news_list = get_cls_news()
    
    if not news_list:
        print("\n方法1未获取到新闻，尝试方法2: 使用Selenium...")
        news_list = get_cls_news_selenium()
    
    if news_list:
        print_news(news_list)
        print(f"\n共获取 {len(news_list)} 条新闻")
    else:
        print("\n未获取到新闻内容")
        print("\n提示：")
        print("1. 财联社使用Next.js动态渲染，可能需要使用Selenium/Playwright")
        print("2. 安装selenium: pip install selenium")
        print("3. 安装chromedriver: https://chromedriver.chromium.org/")
