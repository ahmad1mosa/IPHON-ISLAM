package com.gs.islam;

import android.Manifest;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.view.View;
import android.webkit.GeolocationPermissions;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import androidx.annotation.NonNull;
import androidx.appcompat.app.AppCompatActivity;
import androidx.core.app.ActivityCompat;
import androidx.core.content.ContextCompat;

import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;

public class MainActivity extends AppCompatActivity implements SensorEventListener {

    private WebView webView;
    private static final int LOCATION_PERMISSION_REQUEST = 1001;
    private GeolocationPermissions.Callback locationCallback;
    private String locationOrigin;

    // حساسات البوصلة الهاردوير
    private SensorManager sensorManager;
    private Sensor rotationVectorSensor;
    private Sensor accelerometer;
    private Sensor magnetometer;
    private float[] gravity;
    private float[] geomagnetic;
    private float lastHeading = -1;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // إخفاء شريط العنوان
        getWindow().getDecorView().setSystemUiVisibility(
                View.SYSTEM_UI_FLAG_LAYOUT_STABLE | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
        );

        webView = new WebView(this);
        setContentView(webView);

        setupWebView();
        checkPermissions();
        initCompassSensors();

        // مسح الكاش لضمان تحميل أحدث ملفات الواجهة والبرمجيات دائماً
        webView.clearCache(true);

        // تحميل ملفات التطبيق من مجلد assets الداخلي ليعمل 100% بدون إنترنت
        webView.loadUrl("file:///android_asset/index.html");
    }

    private void initCompassSensors() {
        sensorManager = (SensorManager) getSystemService(SENSOR_SERVICE);
        if (sensorManager != null) {
            rotationVectorSensor = sensorManager.getDefaultSensor(Sensor.TYPE_ROTATION_VECTOR);
            if (rotationVectorSensor == null) {
                accelerometer = sensorManager.getDefaultSensor(Sensor.TYPE_ACCELEROMETER);
                magnetometer = sensorManager.getDefaultSensor(Sensor.TYPE_MAGNETIC_FIELD);
            }
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (sensorManager != null) {
            if (rotationVectorSensor != null) {
                sensorManager.registerListener(this, rotationVectorSensor, SensorManager.SENSOR_DELAY_UI);
            } else {
                if (accelerometer != null) sensorManager.registerListener(this, accelerometer, SensorManager.SENSOR_DELAY_UI);
                if (magnetometer != null) sensorManager.registerListener(this, magnetometer, SensorManager.SENSOR_DELAY_UI);
            }
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (sensorManager != null) {
            sensorManager.unregisterListener(this);
        }
    }

    private float smoothedHeading = -1;
    private long lastSendTime = 0;
    private static final float ALPHA = 0.15f; // معامل تنعيم الفلتر

    @Override
    public void onSensorChanged(SensorEvent event) {
        float heading = -1;

        if (event.sensor.getType() == Sensor.TYPE_ROTATION_VECTOR) {
            float[] rotationMatrix = new float[9];
            SensorManager.getRotationMatrixFromVector(rotationMatrix, event.values);
            float[] orientation = new float[3];
            SensorManager.getOrientation(rotationMatrix, orientation);
            heading = (float) Math.toDegrees(orientation[0]);
            if (heading < 0) heading += 360;
        } else {
            if (event.sensor.getType() == Sensor.TYPE_ACCELEROMETER) {
                if (gravity == null) gravity = new float[3];
                // فلترة الجاذبية
                gravity[0] = gravity[0] * 0.8f + event.values[0] * 0.2f;
                gravity[1] = gravity[1] * 0.8f + event.values[1] * 0.2f;
                gravity[2] = gravity[2] * 0.8f + event.values[2] * 0.2f;
            }
            if (event.sensor.getType() == Sensor.TYPE_MAGNETIC_FIELD) {
                if (geomagnetic == null) geomagnetic = new float[3];
                // فلترة المجال المغناطيسي
                geomagnetic[0] = geomagnetic[0] * 0.8f + event.values[0] * 0.2f;
                geomagnetic[1] = geomagnetic[1] * 0.8f + event.values[1] * 0.2f;
                geomagnetic[2] = geomagnetic[2] * 0.8f + event.values[2] * 0.2f;
            }
            if (gravity != null && geomagnetic != null) {
                float[] R = new float[9];
                float[] I = new float[9];
                if (SensorManager.getRotationMatrix(R, I, gravity, geomagnetic)) {
                    float[] orientation = new float[3];
                    SensorManager.getOrientation(R, orientation);
                    heading = (float) Math.toDegrees(orientation[0]);
                    if (heading < 0) heading += 360;
                }
            }
        }

        if (heading >= 0) {
            // فلتر الزوايا الدائري (Circular Low-Pass Filter) لمنع الرعشة والترقص
            if (smoothedHeading < 0) {
                smoothedHeading = heading;
            } else {
                float diff = (heading - smoothedHeading + 540) % 360 - 180;
                // عتبة الحركة البسيطة لإلغاء ضجيج الحساس الميكروسكوبي
                if (Math.abs(diff) < 0.4f) {
                    return;
                }
                smoothedHeading = (smoothedHeading + ALPHA * diff + 360) % 360;
            }

            long now = System.currentTimeMillis();
            // إرسال التحديث بمعدل سلس (35ms) لضمان ثبات وجمال الحركة
            if (now - lastSendTime >= 35) {
                lastSendTime = now;
                final float finalHeading = smoothedHeading;
                if (webView != null) {
                    webView.post(new Runnable() {
                        @Override
                        public void run() {
                            webView.evaluateJavascript(
                                "if(window.onAndroidHeadingUpdate){window.onAndroidHeadingUpdate(" + String.format(java.util.Locale.US, "%.1f", finalHeading) + ");}",
                                null
                            );
                        }
                    });
                }
            }
        }
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {
    }

    private void setupWebView() {
        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setAllowFileAccess(true);
        settings.setAllowContentAccess(true);
        settings.setAllowFileAccessFromFileURLs(true);
        settings.setAllowUniversalAccessFromFileURLs(true);
        settings.setMediaPlaybackRequiresUserGesture(false);
        settings.setGeolocationEnabled(true);
        settings.setCacheMode(WebSettings.LOAD_NO_CACHE);

        webView.setWebViewClient(new WebViewClient());

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onGeolocationPermissionsShowPrompt(String origin, GeolocationPermissions.Callback callback) {
                if (ContextCompat.checkSelfPermission(MainActivity.this, Manifest.permission.ACCESS_FINE_LOCATION)
                        != PackageManager.PERMISSION_GRANTED) {
                    locationCallback = callback;
                    locationOrigin = origin;
                    ActivityCompat.requestPermissions(MainActivity.this,
                            new String[]{Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION},
                            LOCATION_PERMISSION_REQUEST);
                } else {
                    callback.invoke(origin, true, false);
                }
            }
        });
    }

    private void checkPermissions() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION)
                != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(this,
                    new String[]{Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION},
                    LOCATION_PERMISSION_REQUEST);
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, @NonNull String[] permissions, @NonNull int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == LOCATION_PERMISSION_REQUEST) {
            if (grantResults.length > 0 && grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                if (locationCallback != null && locationOrigin != null) {
                    locationCallback.invoke(locationOrigin, true, false);
                }
            }
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null) {
            webView.evaluateJavascript(
                "(function() { return (window.handleAndroidBackPressed && window.handleAndroidBackPressed()) ? 'true' : 'false'; })()",
                new ValueCallback<String>() {
                    @Override
                    public void onReceiveValue(String value) {
                        if ("\"true\"".equals(value) || "true".equals(value)) {
                            // تم إغلاق قارئ السورة أو سلايد الإعدادات داخل التطبيق
                            return;
                        }
                        if (webView.canGoBack()) {
                            webView.goBack();
                        } else {
                            MainActivity.super.onBackPressed();
                        }
                    }
                }
            );
        } else {
            super.onBackPressed();
        }
    }
}
