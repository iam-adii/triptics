<?php
/**
 * Simple rate limiting functionality
 */
class RateLimit {
    private $dataFile;
    private $ipData = [];
    private $config;
    
    public function __construct($config) {
        $this->config = $config;
        $this->dataFile = __DIR__ . '/rate-limit-data.json';
        $this->loadData();
    }
    
    /**
     * Load rate limit data from file
     */
    private function loadData() {
        if (file_exists($this->dataFile)) {
            $content = file_get_contents($this->dataFile);
            $this->ipData = json_decode($content, true) ?: [];
        }
        
        // Clean up old entries (older than 1 hour)
        $now = time();
        foreach ($this->ipData as $ip => $data) {
            if ($now - $data['timestamp'] > 3600) {
                unset($this->ipData[$ip]);
            }
        }
    }
    
    /**
     * Save rate limit data to file
     */
    private function saveData() {
        file_put_contents($this->dataFile, json_encode($this->ipData));
    }
    
    /**
     * Check if the current IP is rate limited
     * 
     * @return bool|string True if allowed, error message if limited
     */
    public function check() {
        $ip = $_SERVER['REMOTE_ADDR'];
        $now = time();
        
        if (!isset($this->ipData[$ip])) {
            $this->ipData[$ip] = [
                'count' => 1,
                'timestamp' => $now
            ];
            $this->saveData();
            return true;
        }
        
        // Reset count if it's been more than an hour
        if ($now - $this->ipData[$ip]['timestamp'] > 3600) {
            $this->ipData[$ip] = [
                'count' => 1,
                'timestamp' => $now
            ];
            $this->saveData();
            return true;
        }
        
        // Check if rate limit exceeded
        if ($this->ipData[$ip]['count'] >= $this->config['security']['rate_limit']) {
            $minutesLeft = ceil((3600 - ($now - $this->ipData[$ip]['timestamp'])) / 60);
            return "Rate limit exceeded. Please try again in {$minutesLeft} minutes.";
        }
        
        // Increment count
        $this->ipData[$ip]['count']++;
        $this->saveData();
        return true;
    }
} 