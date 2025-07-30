#include <NimBLEDevice.h>
#include <WiFi.h>
#include <HTTPClient.h>
#include <queue>
#include <set>  // Use a set to avoid duplicate MAC addresses

const char* ssid = "Helloo";
const char* password = "1234567890";
const char* serverUrl = "https://smart-attendance-mark-system.onrender.com/api/attendance/mac"; 

const int scanTime = 5;  // BLE scan duration in seconds
const bool activeScan = true;  // Perform active scan

std::queue<String> macQueue;  // Queue to hold unique UUIDs
std::set<String> detectedUUIDs;  // Set to store detected UUIDs (prevents duplicates)

void sendMacToServer();
void connectToWiFi();

void ensureWiFiConnected() {
  if (WiFi.status() != WL_CONNECTED) {
    connectToWiFi();
  }
}

void connectToWiFi() {
  Serial.print("Connecting to WiFi...");
  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.print(".");
  }

  Serial.println("\nConnected to WiFi");
}

class MyAdvertisedDeviceCallbacks : public NimBLEAdvertisedDeviceCallbacks {
  void onResult(NimBLEAdvertisedDevice* device) {
    if (device->haveServiceUUID()) {
      NimBLEUUID uuid = device->getServiceUUID();
      
      if (uuid.bitSize() == 16) {
        uint16_t uuid16 = uuid.getNative()->u16.value;
        
        if (uuid16 == 0x181C || uuid16 == 0x181E || uuid16 == 0x181F) {  
          String foundMac = (uuid16 == 0x181C) ? "181C" : (uuid16 == 0x181E) ? "181E" : "181F";

          if (detectedUUIDs.find(foundMac) == detectedUUIDs.end()) {  // Avoid duplicates
            macQueue.push(foundMac);
            detectedUUIDs.insert(foundMac);
            Serial.print("Found Matching UUID: ");
            Serial.println(foundMac);
          }
        }
      }
    }
  }
};

void setup() {
  Serial.begin(115200);
  
  connectToWiFi();
  
  // Initialize BLE Scanner
  Serial.println("Starting BLE UUID Scanner...");
  NimBLEDevice::init("UUID-Scanner");
  NimBLEDevice::setPower(ESP_PWR_LVL_P9);
}

void loop() {
  if (macQueue.empty()) {  // Only scan if queue is empty
    NimBLEScan* scanner = NimBLEDevice::getScan();
    static MyAdvertisedDeviceCallbacks callbacks;
    scanner->setAdvertisedDeviceCallbacks(&callbacks, false);
    scanner->setActiveScan(activeScan);
    scanner->start(scanTime, false);

    Serial.println("Scanning...");
    delay(5000);
  }

  if (!macQueue.empty()) {  // If UUIDs are found, send them one by one
    ensureWiFiConnected();
    sendMacToServer();
  }
}

void sendMacToServer() {
  if (WiFi.status() == WL_CONNECTED && !macQueue.empty()) {
    HTTPClient http;
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    
    String macToSend = macQueue.front();  // Get first UUID from the queue
    macQueue.pop();  // Remove it after sending

    String jsonPayload = "{\"mac_address\": \"" + macToSend + "\"}";
    Serial.println("Sending JSON: " + jsonPayload);
    
    int httpResponseCode = http.POST(jsonPayload);
    
    if (httpResponseCode > 0) {
      Serial.println("Response Code: " + String(httpResponseCode));
      Serial.println("Response: " + http.getString());
    } else {
      Serial.println("Error sending request: " + String(httpResponseCode));
    }

    http.end();
  } else {
    Serial.println("WiFi not connected");
  }
}
