from flask import Flask, request, jsonify, send_from_directory
import requests
from bs4 import BeautifulSoup
import re
import os
from urllib.parse import urljoin, urlparse

app = Flask(__name__, static_folder='.')

# 设置请求头，模拟浏览器
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8'
}

@app.route('/')
def index():
    return send_from_directory('.', 'index.html')

@app.route('/proxy')
def proxy():
    url = request.args.get('url')
    if not url:
        return jsonify({'error': '缺少URL参数'}), 400
    
    try:
        # 添加Referer头，避免某些网站的防盗链
        custom_headers = headers.copy()
        custom_headers['Referer'] = url
        parsed_url = urlparse(url)
        custom_headers['Origin'] = f"{parsed_url.scheme}://{parsed_url.netloc}"
        custom_headers['Host'] = parsed_url.netloc
        
        response = requests.get(url, headers=custom_headers, timeout=10)
        response.raise_for_status()
        
        # 返回获取到的内容
        return response.text
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# 添加一个新的路由来代理视频内容，解决防盗链问题
@app.route('/video-proxy')
def video_proxy():
    url = request.args.get('url')
    if not url:
        return jsonify({'error': '缺少URL参数'}), 400
    
    try:
        # 获取原始URL的域名作为Referer
        parsed_url = urlparse(url)
        referer = f"{parsed_url.scheme}://{parsed_url.netloc}"
        
        # 添加防盗链相关的请求头
        custom_headers = headers.copy()
        custom_headers['Referer'] = referer
        custom_headers['Origin'] = referer
        
        # 不要设置Host头，让requests自动处理
        # custom_headers['Host'] = parsed_url.netloc
        
        print(f"正在请求视频: {url}")
        print(f"使用的请求头: {custom_headers}")
        
        # 使用流式请求获取视频内容
        response = requests.get(url, headers=custom_headers, stream=True, timeout=15)
        response.raise_for_status()
        
        print(f"视频请求成功，状态码: {response.status_code}")
        print(f"响应头: {response.headers}")
        
        # 设置响应头，保持原始内容类型
        headers_to_forward = {
            'Content-Type': response.headers.get('Content-Type', 'application/octet-stream'),
            'Content-Length': response.headers.get('Content-Length', ''),
            'Accept-Ranges': 'bytes',
            'Access-Control-Allow-Origin': '*'
        }
        
        # 返回视频内容
        return response.raw.read(), 200, headers_to_forward
    except Exception as e:
        print(f"视频代理错误: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/extract')
def extract():
    url = request.args.get('url')
    if not url:
        return jsonify({'error': '缺少URL参数'}), 400
    
    try:
        print(f"正在解析URL: {url}")
        
        # 添加Referer头，避免某些网站的防盗链
        custom_headers = headers.copy()
        custom_headers['Referer'] = url
        parsed_url = urlparse(url)
        custom_headers['Origin'] = f"{parsed_url.scheme}://{parsed_url.netloc}"
        
        print(f"使用的请求头: {custom_headers}")
        
        response = requests.get(url, headers=custom_headers, timeout=10)
        response.raise_for_status()
        
        print(f"页面请求成功，状态码: {response.status_code}")
        print(f"页面大小: {len(response.text)} 字节")
        
        # 解析HTML
        soup = BeautifulSoup(response.text, 'html.parser')
        video_urls = []
        
        # 查找video标签
        for video in soup.find_all('video'):
            src = video.get('src')
            if src:
                video_urls.append(src)
                print(f"找到video标签: {src}")
            
            # 查找source标签
            for source in video.find_all('source'):
                src = source.get('src')
                if src:
                    video_urls.append(src)
                    print(f"找到source标签: {src}")
        
        # 查找iframe标签（嵌入视频）
        for iframe in soup.find_all('iframe'):
            src = iframe.get('src')
            if src and any(domain in src for domain in ['youtube', 'vimeo', 'bilibili']):
                video_urls.append(src)
                print(f"找到iframe标签: {src}")
        
        # 查找a标签中的视频链接
        video_extensions = ['.mp4', '.webm', '.ogg', '.m3u8', '.mov', '.avi', '.wmv', '.flv']
        for link in soup.find_all('a'):
            href = link.get('href')
            if href and any(href.lower().endswith(ext) for ext in video_extensions):
                video_urls.append(href)
                print(f"找到a标签视频链接: {href}")
        
        # 查找页面中的JSON数据（可能包含视频信息）
        scripts = soup.find_all('script')
        for script in scripts:
            if script.string:
                # 查找可能的视频URL模式
                url_matches = re.findall(r'"(https?://[^"]*\.(?:mp4|webm|ogg|m3u8|mov|avi|wmv|flv)[^"]*)"', script.string)
                for match in url_matches:
                    video_urls.append(match)
                    print(f"在脚本中找到视频URL(引号): {match}")
                
                # 查找更多可能的视频URL模式（不带引号的）
                more_matches = re.findall(r'(https?://[^"\s]*\.(?:mp4|webm|ogg|m3u8|mov|avi|wmv|flv)[^"\s]*)', script.string)
                for match in more_matches:
                    video_urls.append(match)
                    print(f"在脚本中找到视频URL(无引号): {match}")
        
        # 解析相对URL为绝对URL
        for i, video_url in enumerate(video_urls):
            if not video_url.startswith(('http://', 'https://')):
                try:
                    video_urls[i] = urljoin(response.url, video_url)
                    print(f"将相对URL转换为绝对URL: {video_url} -> {video_urls[i]}")
                except Exception as e:
                    print(f"URL转换错误: {str(e)}")
        
        # 去重
        video_urls = list(set(video_urls))
        print(f"去重后找到 {len(video_urls)} 个视频URL")
        
        # 检查URL是否可访问，并通过代理提供
        valid_urls = []
        for video_url in video_urls:
            try:
                # 将视频URL转换为通过我们的代理访问
                proxied_url = f"/video-proxy?url={video_url}"
                valid_urls.append({
                    'original_url': video_url,
                    'proxied_url': proxied_url
                })
                print(f"添加有效URL: {video_url}")
            except Exception as e:
                print(f"处理URL时出错: {video_url}, 错误: {str(e)}")
        
        print(f"最终返回 {len(valid_urls)} 个有效URL")
        return jsonify({'urls': valid_urls})
    except Exception as e:
        print(f"解析错误: {str(e)}")
        return jsonify({'error': str(e)}), 500

@app.route('/test')
def test():
    return jsonify({
        'status': 'ok',
        'message': '服务器正常运行',
        'time': str(datetime.datetime.now())
    })

if __name__ == '__main__':
    import datetime
    print(f"服务器启动于 {datetime.datetime.now()}")
    app.run(debug=True, port=5000)