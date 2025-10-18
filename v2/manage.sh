#!/bin/bash

# StorySeed v2 Management Script

show_help() {
    cat << EOF
StorySeed v2 Management Script
==============================

Usage: ./manage.sh [command]

Commands:
    start       Start the application
    stop        Stop the application
    restart     Restart the application
    status      Show application status
    logs        Show live logs
    errors      Show error logs only
    health      Check application health
    build       Build frontend only
    deploy      Full deployment (build + restart)
    monitor     Open PM2 monitor
    flush       Clear all logs
    info        Show detailed process info
    help        Show this help message

Examples:
    ./manage.sh start
    ./manage.sh logs
    ./manage.sh health

EOF
}

case "$1" in
    start)
        echo "▶️  Starting StorySeed v2..."
        pm2 start ecosystem.config.cjs
        ;;
    stop)
        echo "⏸️  Stopping StorySeed v2..."
        pm2 stop seedling-v2
        ;;
    restart)
        echo "🔄 Restarting StorySeed v2..."
        pm2 restart seedling-v2
        ;;
    status)
        pm2 status seedling-v2
        ;;
    logs)
        pm2 logs seedling-v2
        ;;
    errors)
        pm2 logs seedling-v2 --err
        ;;
    health)
        echo "🏥 Checking application health..."
        response=$(curl -s http://localhost:3005/api/health)
        if [ $? -eq 0 ]; then
            echo "✅ Application is healthy!"
            echo "$response" | python3 -m json.tool 2>/dev/null || echo "$response"
        else
            echo "❌ Application is not responding"
            exit 1
        fi
        ;;
    build)
        echo "🏗️  Building frontend..."
        npm run build
        ;;
    deploy)
        ./deploy.sh
        ;;
    monitor)
        pm2 monit
        ;;
    flush)
        echo "🧹 Clearing logs..."
        pm2 flush seedling-v2
        echo "✅ Logs cleared"
        ;;
    info)
        pm2 describe seedling-v2
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        echo "❌ Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
